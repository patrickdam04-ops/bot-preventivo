import { redirect } from "next/navigation";
import { getFirstCliente } from "@/lib/config";

export default function Home() {
  const primo = getFirstCliente();
  if (primo) redirect(`/${primo.slug}`);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-gray-500">Nessun cliente configurato.</p>
    </div>
  );
}
