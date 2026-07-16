"use client";

import { forwardRef, useState } from "react";

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.2 3.2" />
      <path d="M6.6 6.6A18.5 18.5 0 0 0 2 12s3.5 8 10 8a10.6 10.6 0 0 0 5.1-1.3" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

export const PasswordInput = forwardRef(function PasswordInput(
  { className = "", id, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        {...props}
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        className={`input password-input__field ${className}`.trim()}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
});
