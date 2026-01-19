import { useState } from 'react';
import emailjs from '@emailjs/browser';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ message?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 실시간 검증
    if (name === 'message') {
      if (value && value.length < 50) {
        setErrors(prev => ({ ...prev, message: '피드백 내용은 50자 이상 입력해주세요.' }));
      } else {
        setErrors(prev => ({ ...prev, message: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 검증
    const messageValid = formData.message.length >= 50;
    
    if (!messageValid) {
      setErrors(prev => ({ ...prev, message: '피드백 내용은 50자 이상 입력해주세요.' }));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // EmailJS 환경 변수에서 설정값 가져오기
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.');
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: '익명 사용자',
          from_email: 'anonymous@feedback.com',
          subject: formData.subject,
          message: formData.message,
        },
        publicKey
      );

      setSubmitStatus('success');
      setFormData({ subject: '', message: '' });
      
      // 3초 후 자동으로 닫기
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('피드백 전송 실패:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">피드백 보내기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="피드백 제목을 입력해주세요"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              내용 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">
                ({formData.message.length}/50자 이상)
              </span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="기능 개선 제안, 발견한 오류나 틀린 부분, 또는 자유로운 의견을 50자 이상 작성해주세요. 어떤 내용이든 환영합니다!"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
            {!errors.message && formData.message.length > 0 && formData.message.length < 50 && (
              <p className="mt-1 text-sm text-gray-500">
                {50 - formData.message.length}자 더 입력해주세요.
              </p>
            )}
          </div>

          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              피드백이 성공적으로 전송되었습니다. 감사합니다!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              피드백 전송에 실패했습니다. 잠시 후 다시 시도해주세요.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting || 
                formData.message.length < 50 ||
                !formData.subject.trim()
              }
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '전송 중...' : '전송하기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
