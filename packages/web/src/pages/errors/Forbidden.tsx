import CardLayout from "@/layouts/CardLayout";

export default function Forbidden() {
  return (
    <CardLayout title="Access denied" description="You don't have permission to view this page.">
      <a className="primary" href="/">
        Home
      </a>
    </CardLayout>
  );
}
