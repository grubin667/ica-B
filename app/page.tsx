import HomePage from "./components/home-page";
import { SWRProvider } from "./swr-provider";

export default async function Home() {

  return (
    <SWRProvider>
      <HomePage />
    </SWRProvider>
  );
}
