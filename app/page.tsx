import Header from "@/components/Header";
import LandingExperience from "@/components/landing/LandingExperience";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-paper">
      <Header />
      <LandingExperience />
    </div>
  );
}
