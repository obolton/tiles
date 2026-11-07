import CardLayout from "@/layouts/CardLayout";

export default function NotFound() {
  return (
    <CardLayout title="Page not found" description="This page doesn't exist or isn't available.">
      <a className="primary" href="/">
        Home
      </a>
    </CardLayout>
  );
}
