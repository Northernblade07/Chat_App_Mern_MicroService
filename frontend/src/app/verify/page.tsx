import { Suspense } from "react";
import VerifyContent from "./VerifyContent";
import Loading from "@/components/Loading";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyContent />
    </Suspense>
  );
}
