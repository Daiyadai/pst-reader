"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  label: string;
  description: string;
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({
  label,
  description,
  onImageSelect,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onImageSelect(file);
  }

  return (
    <div>
      <p className="text-sm font-semibold text-navy-800 mb-2">{label}</p>

      {preview ? (
        <div className="border-2 border-navy-300 rounded-xl p-4 bg-white text-center">
          <img
            src={preview}
            alt={label}
            className="max-h-48 mx-auto rounded-lg shadow-sm mb-3"
          />
          <p className="text-xs text-navy-500 mb-2">{fileName}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-navy-500 hover:text-navy-700 underline"
          >
            更换图片
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border-2 border-dashed border-navy-200 rounded-xl bg-white hover:border-navy-400 hover:bg-navy-50 transition-all">
          <label className="block cursor-pointer p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            <div className="py-4">
              <svg
                className="w-10 h-10 text-navy-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-navy-600 font-medium">{description}</p>
              <p className="text-xs text-navy-400 mt-1">点击选择文件</p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
