"""
API Integration for Advanced Face Recognition System
Connects the new OpenCV system with the existing Supabase database
"""

import asyncio
import base64
import io
import json
import logging
from typing import Dict, List, Optional
import numpy as np
import cv2
from PIL import Image
import os
from supabase import create_client, Client
from advanced_face_recognition import AdvancedFaceRecognition, AttendanceSystem

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceRecognitionAPI:
    """
    API wrapper for the advanced face recognition system
    """
    
    def __init__(self):
        # Initialize Supabase client
        self.supabase: Client = create_client(
            os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
        
        # Initialize face recognition system
        self.face_system = AdvancedFaceRecognition()
        self.attendance_system = AttendanceSystem()
        
        # Load existing model if available
        if os.path.exists("trained_model.pkl"):
            self.face_system.load_model("trained_model.pkl")
            logger.info("Loaded existing trained model")
    
    async def process_student_photo(self, student_id: str) -> Dict:
        """
        Process a student's photo to extract face encoding
        """
        try:
            # Get student data from Supabase
            response = self.supabase.table("students").select("*").eq("id", student_id).single().execute()
            
            if not response.data:
                return {"success": False, "message": "Student not found"}
            
            student = response.data
            
            if not student.get("photo_url"):
                return {"success": False, "message": "No photo found for student"}
            
            # Download and process image
            image = await self._download_image(student["photo_url"])
            if image is None:
                return {"success": False, "message": "Could not download student photo"}
            
            # Detect faces
            detected_faces = self.face_system.detect_faces_advanced(image)
            
            if not detected_faces:
                return {"success": False, "message": "No face detected in photo"}
            
            # Use the best quality face
            best_face = max(detected_faces, key=lambda f: f['confidence'])
            
            # Quality assessment
            quality = self.face_system.assess_face_quality(image, best_face['box'])
            
            if quality['overall'] < 0.6:
                return {
                    "success": False, 
                    "message": f"Photo quality too low (score: {quality['overall']:.2f})"
                }
            
            # Liveness check
            if not self.face_system.detect_liveness(image, best_face['box']):
                return {"success": False, "message": "Liveness check failed - possible spoof detected"}
            
            # Extract face encoding
            encoding = self.face_system.extract_face_encoding(image, best_face['box'])
            
            if encoding is None:
                return {"success": False, "message": "Could not extract face encoding"}
            
            # Save encoding to database
            update_response = self.supabase.table("students").update({
                "face_encoding": encoding.tolist(),
                "face_quality_score": quality['overall'],
                "updated_at": "now()"
            }).eq("id", student_id).execute()
            
            if update_response.data:
                return {
                    "success": True,
                    "message": f"Face encoding generated for {student['name']}",
                    "quality_score": quality['overall'],
                    "confidence": best_face['confidence']
                }
            else:
                return {"success": False, "message": "Failed to save face encoding"}
                
        except Exception as e:
            logger.error(f"Error processing student photo: {e}")
            return {"success": False, "message": f"Processing error: {str(e)}"}
    
    async def recognize_attendance(self, session_id: str, image_data: str) -> Dict:
        """
        Process attendance recognition from camera image
        """
        try:
            # Get session details
            session_response = self.supabase.table("class_sessions").select("*").eq("id", session_id).single().execute()
            
            if not session_response.data:
                return {"success": False, "message": "Class session not found"}
            
            session = session_response.data
            
            # Decode image data
            image = self._decode_base64_image(image_data)
            if image is None:
                return {"success": False, "message": "Invalid image data"}
            
            # Get enrolled students with face encodings
            students_response = self.supabase.table("students").select(
                "id, name, student_id, face_encoding, face_quality_score"
            ).not_("face_encoding", "is", None).execute()
            
            if not students_response.data:
                return {"success": False, "message": "No students with face encodings found"}
            
            # Load known faces into the system
            self._load_known_faces(students_response.data)
            
            # Recognize faces in the image
            recognition_results = self.face_system.recognize_face(image)
            
            attendance_records = []
            
            for result in recognition_results:
                if result['student_id'] and result['confidence'] >= 0.85:
                    # Check if attendance already recorded
                    existing_response = self.supabase.table("attendance_logs").select("id").eq(
                        "student_id", result['student_id']
                    ).eq("session_id", session_id).execute()
                    
                    if existing_response.data:
                        attendance_records.append({
                            "student_id": result['student_id'],
                            "name": result['name'],
                            "status": "already_marked",
                            "confidence": result['confidence']
                        })
                    else:
                        # Record attendance
                        attendance_response = self.supabase.table("attendance_logs").insert({
                            "student_id": result['student_id'],
                            "session_id": session_id,
                            "confidence_score": result['confidence'],
                            "method": "advanced_facial_recognition",
                            "quality_score": result['quality']['overall'],
                            "timestamp": "now()"
                        }).execute()
                        
                        if attendance_response.data:
                            attendance_records.append({
                                "student_id": result['student_id'],
                                "name": result['name'],
                                "status": "marked",
                                "confidence": result['confidence'],
                                "quality": result['quality']['overall']
                            })
            
            if attendance_records:
                return {
                    "success": True,
                    "message": f"Processed {len(attendance_records)} attendance records",
                    "records": attendance_records
                }
            else:
                return {
                    "success": False,
                    "message": "No students recognized with sufficient confidence"
                }
                
        except Exception as e:
            logger.error(f"Error in attendance recognition: {e}")
            return {"success": False, "message": f"Recognition error: {str(e)}"}
    
    async def batch_process_students(self, student_ids: List[str]) -> Dict:
        """
        Process multiple students' photos in batch
        """
        results = []
        successful = 0
        
        for student_id in student_ids:
            result = await self.process_student_photo(student_id)
            results.append({
                "student_id": student_id,
                "result": result
            })
            
            if result["success"]:
                successful += 1
        
        # Retrain the system with new encodings
        if successful > 0:
            await self._retrain_system()
        
        return {
            "success": True,
            "message": f"Batch processing completed: {successful}/{len(student_ids)} successful",
            "results": results,
            "successful_count": successful
        }
    
    async def get_system_status(self) -> Dict:
        """
        Get comprehensive system status and statistics
        """
        try:
            # Get student statistics
            total_students_response = self.supabase.table("students").select("id", count="exact").execute()
            total_students = total_students_response.count or 0
            
            students_with_encodings_response = self.supabase.table("students").select(
                "id", count="exact"
            ).not_("face_encoding", "is", None).execute()
            students_with_encodings = students_with_encodings_response.count or 0
            
            # Get attendance statistics
            today_attendance_response = self.supabase.table("attendance_logs").select(
                "id", count="exact"
            ).gte("timestamp", "today").execute()
            today_attendance = today_attendance_response.count or 0
            
            # Calculate average quality score
            quality_response = self.supabase.table("students").select(
                "face_quality_score"
            ).not_("face_quality_score", "is", None).execute()
            
            avg_quality = 0.0
            if quality_response.data:
                quality_scores = [s["face_quality_score"] for s in quality_response.data if s["face_quality_score"]]
                avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
            
            return {
                "system_status": "active",
                "model_loaded": len(self.face_system.known_encodings) > 0,
                "statistics": {
                    "total_students": total_students,
                    "students_with_encodings": students_with_encodings,
                    "encoding_coverage": (students_with_encodings / total_students * 100) if total_students > 0 else 0,
                    "average_quality_score": avg_quality,
                    "today_attendance": today_attendance
                },
                "settings": {
                    "confidence_threshold": self.face_system.confidence_threshold,
                    "distance_threshold": self.face_system.distance_threshold,
                    "model_type": "advanced_opencv_dnn"
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": f"Error getting system status: {str(e)}"}
    
    def _load_known_faces(self, students_data: List[Dict]):
        """Load known faces into the recognition system"""
        self.face_system.known_encodings = []
        self.face_system.known_names = []
        self.face_system.known_ids = []
        
        for student in students_data:
            if student.get('face_encoding'):
                try:
                    encoding = np.array(student['face_encoding'])
                    self.face_system.known_encodings.append(encoding)
                    self.face_system.known_names.append(student['name'])
                    self.face_system.known_ids.append(student['id'])
                except Exception as e:
                    logger.error(f"Error loading encoding for student {student['id']}: {e}")
    
    async def _download_image(self, image_url: str) -> Optional[np.ndarray]:
        """Download image from URL"""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        image = Image.open(io.BytesIO(image_data))
                        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            return None
        except Exception as e:
            logger.error(f"Error downloading image: {e}")
            return None
    
    def _decode_base64_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data"""
        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return None
    
    async def _retrain_system(self):
        """Retrain the face recognition system"""
        try:
            # Get all students with encodings
            students_response = self.supabase.table("students").select(
                "id, name, student_id, face_encoding"
            ).not_("face_encoding", "is", None).execute()
            
            if students_response.data:
                self._load_known_faces(students_response.data)
                self.face_system.save_model("trained_model.pkl")
                logger.info("System retrained successfully")
        except Exception as e:
            logger.error(f"Error retraining system: {e}")

# Example usage
if __name__ == "__main__":
    api = FaceRecognitionAPI()
    
    # Example: Process a student's photo
    # result = asyncio.run(api.process_student_photo("student_id_here"))
    # print("Processing result:", result)
    
    # Example: Get system status
    # status = asyncio.run(api.get_system_status())
    # print("System status:", status)
    
    print("Advanced Face Recognition API initialized successfully!")
