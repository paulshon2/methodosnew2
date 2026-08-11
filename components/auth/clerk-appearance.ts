/** Clerk SignIn/SignUp 공통 라이트 테마 (흰·밝은 파란) */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorInputBackground: "#f0f7ff",
    colorInputText: "#0f172a",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "mx-auto w-full max-w-[400px]",
    card: "bg-white border border-[#dbeafe] shadow-lg rounded-2xl",
    headerTitle: "text-[#0f172a]",
    headerSubtitle: "text-[#64748b]",
    socialButtonsBlockButton: "bg-[#f0f7ff] border border-[#bfdbfe] text-[#0f172a] hover:bg-[#dbeafe]",
    socialButtonsBlockButtonText: "text-[#0f172a] font-medium",
    formFieldLabel: "text-[#64748b]",
    formFieldInput: "bg-[#f0f7ff] border-[#bfdbfe] text-[#0f172a]",
    formButtonPrimary: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
    footerActionLink: "text-[#2563eb] hover:text-[#1d4ed8]",
    footerActionText: "text-[#64748b]",
  },
} as const;
