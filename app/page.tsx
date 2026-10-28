import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>My Next.js App</CardTitle>
          <CardDescription>
            Next.js and shadcn/ui are ready to use.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button className="w-full">Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
