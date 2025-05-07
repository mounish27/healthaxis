import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, FileText, Loader } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { uploadFile } from '../utils/upload';

type Message = {
  type: 'user' | 'bot';
  content: string;
  file?: {
    url: string;
    type: 'image' | 'pdf';
    name: string;
  };
  analysis?: {
    condition: string;
    confidence: number;
  }[];
};

// Medical condition mappings for image classification
const MEDICAL_IMAGE_MAPPINGS: { [key: string]: string[] } = {
  // Skin conditions
  'skin': ['dermatitis', 'rash', 'skin', 'dermis', 'epidermis', 'lesion', 'mole'],
  'rash': ['rash', 'hives', 'allergic reaction', 'skin condition', 'eczema', 'psoriasis'],
  'wound': ['wound', 'cut', 'injury', 'laceration', 'abrasion', 'scar'],
  'bandage': ['bandage', 'dressing', 'gauze', 'medical tape', 'cast', 'splint'],
  
  // Common visible conditions
  'swelling': ['swelling', 'edema', 'inflammation', 'bump', 'lump'],
  'bruise': ['bruise', 'contusion', 'black and blue', 'hematoma'],
  'burn': ['burn', 'scald', 'thermal injury', 'blister'],
  
  // Eye conditions
  'eye': ['eye', 'conjunctivitis', 'pink eye', 'vision', 'cataract', 'stye'],
  
  // Other visible symptoms
  'infection': ['infection', 'bacterial', 'fungal', 'pus', 'abscess'],
  'inflammation': ['inflammation', 'swollen', 'red', 'tender'],
  
  // Additional conditions
  'joint': ['joint', 'arthritis', 'swollen joint', 'knee', 'elbow', 'ankle'],
  'dental': ['tooth', 'gum', 'dental', 'oral', 'mouth'],
  'nail': ['nail', 'fungal', 'ingrown', 'nail bed'],
  'hair': ['hair', 'scalp', 'alopecia', 'baldness']
};

const SYMPTOMS_DATABASE = {
  'headache': ['Migraine', 'Tension headache', 'Sinusitis'],
  'fever': ['Common cold', 'Flu', 'COVID-19'],
  'cough': ['Bronchitis', 'Common cold', 'COVID-19'],
  'rash': ['Eczema', 'Allergic reaction', 'Contact dermatitis'],
  'fatigue': ['Anemia', 'Depression', 'Chronic fatigue syndrome'],
  'nausea': ['Gastroenteritis', 'Food poisoning', 'Morning sickness'],
  'dizziness': ['Vertigo', 'Low blood pressure', 'Inner ear infection'],
  'chest pain': ['Angina', 'Heartburn', 'Muscle strain'],
  'joint pain': ['Arthritis', 'Gout', 'Fibromyalgia'],
  'abdominal pain': ['Gastritis', 'Appendicitis', 'IBS']
} as const;

const MEDICAL_CONDITIONS = {
  'skin_rash': ['Eczema', 'Psoriasis', 'Contact dermatitis'],
  'skin_lesion': ['Melanoma', 'Basal cell carcinoma', 'Acne'],
  'eye_condition': ['Conjunctivitis', 'Cataract', 'Glaucoma'],
  'wound': ['Infection', 'Diabetic ulcer', 'Trauma'],
  'swelling': ['Edema', 'Inflammation', 'Allergic reaction']
} as const;

// Use the correct prediction type from MobileNet
type Prediction = {
  className: string;
  probability: number;
};

export default function AIHealthChat() {
  const [messages, setMessages] = useState<Message[]>([{
    type: 'bot',
    content: 'Hello! I\'m your AI health assistant. How can I help you today?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadModel();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadModel = async () => {
    try {
      await tf.ready();
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
    } catch (error) {
      console.error('Failed to load TensorFlow model:', error);
    }
  };

  const mapToMedicalCondition = (predictions: Prediction[]): { condition: string; confidence: number }[] => {
    const medicalConditions: { condition: string; confidence: number }[] = [];
    
    predictions.forEach(pred => {
      const className = pred.className.toLowerCase();
      
      // Check each medical category
      for (const [condition, keywords] of Object.entries(MEDICAL_IMAGE_MAPPINGS)) {
        if (keywords.some(keyword => className.includes(keyword.toLowerCase()))) {
          // Map to specific medical conditions based on the category
          const specificConditions = MEDICAL_CONDITIONS[condition as keyof typeof MEDICAL_CONDITIONS] || [condition];
          
          specificConditions.forEach((specificCondition, index) => {
            // Adjust confidence based on keyword match position
            const adjustedConfidence = pred.probability * (1 - (index * 0.1));
            medicalConditions.push({
              condition: specificCondition,
              confidence: Number((adjustedConfidence * 100).toFixed(2))
            });
          });
        }
      }
    });

    // Sort by confidence and take top 3
    return medicalConditions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  };

  const analyzeSymptoms = (userMessage: string) => {
    // Check for image-related queries
    const imageKeywords = ['upload', 'image', 'picture', 'photo', 'send', 'share'];
    if (imageKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      return 'You can upload an image by clicking the "Upload Image" button below or by dragging and dropping an image into this chat. I can help analyze visible medical conditions like rashes, wounds, or skin issues. Please note that this is not a substitute for professional medical advice.';
    }

    const symptoms = Object.keys(SYMPTOMS_DATABASE);
    const foundSymptoms = symptoms.filter(symptom => 
      userMessage.toLowerCase().includes(symptom)
    );

    if (foundSymptoms.length === 0) {
      return 'I need more specific information about your symptoms to provide an accurate assessment. Could you describe what you\'re experiencing in more detail? You can also upload an image by clicking the "Upload Image" button below.';
    }

    const possibleConditions = foundSymptoms.flatMap(symptom => 
      SYMPTOMS_DATABASE[symptom as keyof typeof SYMPTOMS_DATABASE]
    );

    return `Based on your symptoms, you might be experiencing one of the following conditions:\n\n${
      [...new Set(possibleConditions)].map(condition => `• ${condition}`).join('\n')
    }\n\nPlease note that this is not a definitive diagnosis. It's important to consult with a healthcare professional for an accurate diagnosis and appropriate treatment. You can also upload an image of your symptoms for additional analysis.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    setIsLoading(true);
    setTimeout(() => {
      const response = analyzeSymptoms(userMessage);
      setMessages(prev => [...prev, { type: 'bot', content: response }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processImage(file);
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Please upload only image files (jpg, png, etc.).'
      }]);
    }
  };

  const processImage = async (file: File) => {
    if (!model) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'The image analysis model is still loading. Please try again in a moment.'
      }]);
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // First upload the file
      const { url, error } = await uploadFile(file);
      if (error) {
        throw new Error(error);
      }

      // Create an image element for TensorFlow processing
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await img.decode();

      // Process the image with TensorFlow
      const tensor = tf.tidy(() => {
        // Create a tensor from the image
        const imageTensor = tf.browser.fromPixels(img);
        // Resize to the required dimensions
        const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
        // Normalize and ensure it's a 3D tensor
        return resized.toFloat().div(255) as tf.Tensor3D;
      });

      // Update progress as we process
      setUploadProgress(50);

      // Classify the image
      const predictions = await model.classify(tensor);
      tensor.dispose();

      setUploadProgress(100);
      const analysis = mapToMedicalCondition(predictions);

      // Display results
      if (analysis.length === 0) {
        setMessages(prev => [
          ...prev,
          {
            type: 'user',
            content: 'I\'ve uploaded an image for analysis.',
            image: url
          },
          {
            type: 'bot',
            content: 'I couldn\'t identify any clear medical conditions in this image. For better results:\n\n' +
                    '• Ensure good lighting\n' +
                    '• Focus directly on the affected area\n' +
                    '• Take the photo from multiple angles if needed\n' +
                    '• Make sure the image is clear and not blurry\n\n' +
                    'Would you like to try uploading another image or describe your symptoms in text?'
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            type: 'user',
            content: 'I\'ve uploaded an image for analysis.',
            image: url
          },
          {
            type: 'bot',
            content: `Based on the image analysis, I've identified these potential conditions:\n\n${
              analysis.map(a => `• ${a.condition} (${a.confidence}% confidence)`).join('\n')
            }\n\nRecommended next steps:\n` +
            '• Document when these symptoms first appeared\n' +
            '• Note any changes in severity or appearance\n' +
            '• Consider scheduling a consultation with a healthcare provider\n\n' +
            'Would you like to provide more details about your symptoms?',
            analysis
          }
        ]);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          content: 'I encountered an error while analyzing the image. Please ensure:\n\n' +
                  '• The file is a valid image format (JPG, PNG)\n' +
                  '• The image size is reasonable (under 10MB)\n' +
                  '• You have a stable internet connection\n\n' +
                  'Would you like to try again?'
        }
      ]);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      await processImage(file);
    } else if (file.type === 'application/pdf') {
      await processPDF(file);
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Please upload only image files (jpg, png) or PDF documents.'
      }]);
    }
  };

  const processPDF = async (file: File) => {
    setIsLoading(true);
    setUploadProgress(0);

    try {
      // First upload the file
      const { url, error } = await uploadFile(file);
      if (error) {
        throw new Error(error);
      }

      setUploadProgress(100);

      // Display the PDF in the chat
      setMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: 'I\'ve uploaded a medical document for analysis.',
          file: {
            url,
            type: 'pdf',
            name: file.name
          }
        },
        {
          type: 'bot',
          content: 'I\'ve received your medical document. While I can\'t provide a medical diagnosis, I can help you understand the general information in your document. What specific information would you like me to help you with?\n\n' +
                  '• Test results\n' +
                  '• Medication instructions\n' +
                  '• Treatment plans\n' +
                  '• General medical terms\n\n' +
                  'Please describe what you\'d like to know more about.'
        }
      ]);
    } catch (error) {
      console.error('Error processing PDF:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'I encountered an error while processing your document. Please ensure:\n\n' +
                '• The file is a valid PDF\n' +
                '• The file size is reasonable (under 10MB)\n' +
                '• You have a stable internet connection\n\n' +
                'Would you like to try again?'
      }]);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadFile(file);
      if (response.error) {
        throw new Error(response.error);
      }

      const newMessage: Message = {
        type: 'user',
        content: file.type === 'application/pdf' 
          ? 'I have uploaded a PDF document for analysis.'
          : 'I have uploaded an image for analysis.',
        file: {
          url: response.url,
          type: file.type.startsWith('image/') ? 'image' : 'pdf',
          name: file.name
        }
      };

      setMessages(prev => [...prev, newMessage]);
      setInput('');
      setIsLoading(false);

      // Process the file based on its type
      await processFile(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: error instanceof Error ? error.message : 'Error uploading file'
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.file && (
                <div className="mb-2">
                  {message.file.type === 'image' ? (
                    <img
                      src={message.file.url}
                      alt="Uploaded for analysis"
                      className="max-w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-white/10 rounded-lg">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm">{message.file.name}</span>
                    </div>
                  )}
                </div>
              )}
              {message.analysis && (
                <div className="mt-2 p-2 bg-white/10 rounded">
                  <h4 className="font-semibold mb-1">Analysis Results:</h4>
                  <ul className="space-y-1">
                    {message.analysis.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        {item.condition} ({item.confidence}% confidence)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-white">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Upload Image or PDF</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your health..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}