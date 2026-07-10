import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="aurora-canvas flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
