import { CustomPrintForm } from "@/components/CustomPrintForm";

export const metadata = { title: "Tlač na mieru" };

export default function TlacNaMieruPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold text-neutral-900">Tlač na mieru</h1>
      <p className="mt-2 text-neutral-600">
        Máš vlastný nápad alebo 3D model? Pošli nám detaily a my ti pripravíme
        cenovú ponuku. Voliteľne môžeš nahrať aj súbor (STL, OBJ, 3MF).
      </p>
      <CustomPrintForm />
    </div>
  );
}
