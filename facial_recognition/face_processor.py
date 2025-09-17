"""
Core facial recognition processing module.
"""
import face_recognition
import cv2
import numpy as np
import json
import logging
from typing import List, Tuple, Optional, Dict
from PIL import Image
import io
import base64

logger = logging.getLogger(__name__)

class FaceProcessor:
    """
    Main class for handling facial recognition operations.
    """
    
    def __init__(self, tolerance: float = 0.6, model: str = 'hog'):
        """
        Initialize the face processor.
        
        Args:
            tolerance: Face matching tolerance (lower = more strict)
            model: Face detection model ('hog' for speed, 'cnn' for accuracy)
        """
        self.tolerance = tolerance
        self.model = model
        self.known_encodings = []
        self.known_student_ids = []
        
    def extract_face_encoding(self, image_data) -> Optional[List[float]]:
        """
        Extract face encoding from an image.
        
        Args:
            image_data: Image data (PIL Image, numpy array, or file path)
            
        Returns:
            Face encoding as a list of floats, or None if no face found
        """
        try:
            # Handle different input types
            if isinstance(image_data, str):
                # File path
                image = face_recognition.load_image_file(image_data)
            elif hasattr(image_data, 'read'):
                # File-like object
                image = face_recognition.load_image_file(image_data)
            elif isinstance(image_data, Image.Image):
                # PIL Image
                image = np.array(image_data)
            elif isinstance(image_data, np.ndarray):
                # Numpy array
                image = image_data
            else:
                logger.error(f"Unsupported image data type: {type(image_data)}")
                return None
            
            # Find face locations
            face_locations = face_recognition.face_locations(image, model=self.model)
            
            if not face_locations:
                logger.warning("No faces found in the image")
                return None
            
            if len(face_locations) > 1:
                logger.warning(f"Multiple faces found ({len(face_locations)}), using the first one")
            
            # Extract face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if face_encodings:
                return face_encodings[0].tolist()
            else:
                logger.warning("Could not generate face encoding")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting face encoding: {str(e)}")
            return None
    
    def load_known_faces(self, students_data: List[Dict]) -> None:
        """
        Load known face encodings from student data.
        
        Args:
            students_data: List of student dictionaries with 'id' and 'face_encoding'
        """
        self.known_encodings = []
        self.known_student_ids = []
        
        for student in students_data:
            if student.get('face_encoding'):
                try:
                    encoding = np.array(student['face_encoding'])
                    self.known_encodings.append(encoding)
                    self.known_student_ids.append(student['id'])
                except Exception as e:
                    logger.error(f"Error loading encoding for student {student['id']}: {str(e)}")
        
        logger.info(f"Loaded {len(self.known_encodings)} known face encodings")
    
    def recognize_face(self, image_data) -> Optional[Dict]:
        """
        Recognize a face in the given image.
        
        Args:
            image_data: Image data containing a face
            
        Returns:
            Dictionary with student_id and confidence, or None if no match
        """
        try:
            # Extract face encoding from the image
            face_encoding = self.extract_face_encoding(image_data)
            
            if face_encoding is None:
                return None
            
            if not self.known_encodings:
                logger.warning("No known face encodings loaded")
                return None
            
            # Compare with known faces
            face_distances = face_recognition.face_distance(
                self.known_encodings, 
                np.array(face_encoding)
            )
            
            # Find the best match
            best_match_index = np.argmin(face_distances)
            best_distance = face_distances[best_match_index]
            
            if best_distance <= self.tolerance:
                confidence = 1.0 - best_distance  # Convert distance to confidence
                return {
                    'student_id': self.known_student_ids[best_match_index],
                    'confidence': float(confidence),
                    'distance': float(best_distance)
                }
            else:
                logger.info(f"No match found. Best distance: {best_distance}")
                return None
                
        except Exception as e:
            logger.error(f"Error recognizing face: {str(e)}")
            return None
    
    def process_video_frame(self, frame: np.ndarray) -> List[Dict]:
        """
        Process a single video frame and detect/recognize faces.
        
        Args:
            frame: Video frame as numpy array
            
        Returns:
            List of recognition results with bounding boxes
        """
        try:
            # Resize frame for faster processing
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(rgb_small_frame, model=self.model)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            
            results = []
            
            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                # Scale back up face locations
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4
                
                # Try to recognize the face
                if self.known_encodings:
                    face_distances = face_recognition.face_distance(self.known_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)
                    best_distance = face_distances[best_match_index]
                    
                    if best_distance <= self.tolerance:
                        confidence = 1.0 - best_distance
                        student_id = self.known_student_ids[best_match_index]
                        name = f"Student {student_id}"
                    else:
                        student_id = None
                        name = "Unknown"
                        confidence = 0.0
                else:
                    student_id = None
                    name = "Unknown"
                    confidence = 0.0
                
                results.append({
                    'student_id': student_id,
                    'name': name,
                    'confidence': float(confidence),
                    'bounding_box': {
                        'top': int(top),
                        'right': int(right),
                        'bottom': int(bottom),
                        'left': int(left)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing video frame: {str(e)}")
            return []

class CameraManager:
    """
    Manages camera operations for live attendance monitoring.
    """
    
    def __init__(self, camera_index: int = 0):
        """
        Initialize camera manager.
        
        Args:
            camera_index: Camera device index (0 for default camera)
        """
        self.camera_index = camera_index
        self.cap = None
        self.is_active = False
        
    def start_camera(self) -> bool:
        """
        Start the camera capture.
        
        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            self.cap = cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                logger.error(f"Could not open camera {self.camera_index}")
                return False
            
            # Set camera properties for better performance
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            self.is_active = True
            logger.info(f"Camera {self.camera_index} started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error starting camera: {str(e)}")
            return False
    
    def stop_camera(self) -> None:
        """Stop the camera capture."""
        if self.cap:
            self.cap.release()
            self.cap = None
        self.is_active = False
        logger.info("Camera stopped")
    
    def capture_frame(self) -> Optional[np.ndarray]:
        """
        Capture a single frame from the camera.
        
        Returns:
            Frame as numpy array, or None if capture failed
        """
        if not self.is_active or not self.cap:
            return None
        
        try:
            ret, frame = self.cap.read()
            if ret:
                return frame
            else:
                logger.warning("Failed to capture frame")
                return None
        except Exception as e:
            logger.error(f"Error capturing frame: {str(e)}")
            return None
    
    def frame_to_base64(self, frame: np.ndarray) -> str:
        """
        Convert frame to base64 string for web transmission.
        
        Args:
            frame: Video frame as numpy array
            
        Returns:
            Base64 encoded image string
        """
        try:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/jpeg;base64,{frame_base64}"
        except Exception as e:
            logger.error(f"Error converting frame to base64: {str(e)}")
            return ""

def draw_recognition_results(frame: np.ndarray, results: List[Dict]) -> np.ndarray:
    """
    Draw recognition results on the frame.
    
    Args:
        frame: Video frame
        results: Recognition results from process_video_frame
        
    Returns:
        Frame with drawn bounding boxes and labels
    """
    for result in results:
        bbox = result['bounding_box']
        name = result['name']
        confidence = result['confidence']
        
        # Choose color based on recognition status
        if result['student_id']:
            color = (0, 255, 0)  # Green for recognized
            label = f"{name} ({confidence:.2f})"
        else:
            color = (0, 0, 255)  # Red for unknown
            label = "Unknown"
        
        # Draw bounding box
        cv2.rectangle(frame, (bbox['left'], bbox['top']), 
                     (bbox['right'], bbox['bottom']), color, 2)
        
        # Draw label
        cv2.rectangle(frame, (bbox['left'], bbox['bottom'] - 35), 
                     (bbox['right'], bbox['bottom']), color, cv2.FILLED)
        cv2.putText(frame, label, (bbox['left'] + 6, bbox['bottom'] - 6), 
                   cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
    
    return frame
