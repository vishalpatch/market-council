export default function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = { sm: "h-4 w-4 border", md: "h-8 w-8 border-2", lg: "h-12 w-12 border-2" };
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[#ece6d9]/10 border-t-[#c8a45d] ${dim[size]}`}
    />
  );
}
