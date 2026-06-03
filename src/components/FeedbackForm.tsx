import { useState } from 'react';

const ISSUES_NEW_URL =
  'https://github.com/powerpower2005/EconomyWordmap/issues/new';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ message?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'message') {
      if (value && value.length < 50) {
        setErrors((prev) => ({ ...prev, message: '피드백 내용은 50자 이상 입력해주세요.' }));
      } else {
        setErrors((prev) => ({ ...prev, message: undefined }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.message.length < 50) {
      setErrors((prev) => ({ ...prev, message: '피드백 내용은 50자 이상 입력해주세요.' }));
      return;
    }

    const body = [
      '## 피드백',
      '',
      formData.message,
      '',
      '---',
      '_Economy Wordmap 웹사이트 피드백 폼에서 작성됨_',
    ].join('\n');

    const params = new URLSearchParams({
      title: formData.subject.trim(),
      body,
    });

    window.open(`${ISSUES_NEW_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
    setFormData({ subject: '', message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">피드백 (GitHub 이슈)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-md px-4 py-3">
            작성 후 GitHub 이슈 페이지가 열립니다. 제출하려면 GitHub 로그인이 필요하며, 이슈는
            저장소에 공개됩니다.
          </p>

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
              placeholder="기능 개선 제안, 발견한 오류나 틀린 부분, 또는 자유로운 의견을 50자 이상 작성해주세요."
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

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={formData.message.length < 50 || !formData.subject.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              GitHub 이슈 작성하기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            <a
              href={ISSUES_NEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              이슈 목록 보기
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
