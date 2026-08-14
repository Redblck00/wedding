import Link from "next/link";

import AuthShell from "@/components/auth-shell";
import LoginForm from "./login-form";

export const metadata = {
  title: "Нэвтрэх",
};

export default async function LoginPage({ searchParams }) {
  // `searchParams` is a promise — reading it is what marks this page dynamic.
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "";

  return (
    <AuthShell
      title="Тавтай морил"
      intro="Урилгаа үргэлжлүүлэн засварлахын тулд нэвтэрнэ үү."
      footer={
        <>
          Бүртгэлгүй юу?{" "}
          <Link href="/register" className="font-medium text-rose hover:underline">
            Бүртгүүлэх
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
