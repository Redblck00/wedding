import Link from "next/link";

import AuthShell from "@/components/auth-shell";
import RegisterForm from "./register-form";

export const metadata = {
  title: "Бүртгүүлэх",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Бүртгүүлэх"
      intro="Хэдхэн талбар бөглөөд урилгаа шууд эхлүүлнэ. Төлбөр шаардахгүй."
      footer={
        <>
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="font-medium text-rose hover:underline">
            Нэвтрэх
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
