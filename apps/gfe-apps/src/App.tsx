import useSWR from "swr";

import { Provider } from "react-redux";
import "./App.css";
import { Footer } from "./components/Footer";
import { store } from "./states/store";

const fetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, init).then((res) => res.json());

function App() {
  const { error, isLoading } = useSWR(
    `https://hacker-news.firebaseio.com/v0/topstories.json`,
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <Provider store={store}>
      <div className="p-0 lg:p-8 min-h-screen flex flex-col">
        <div className="flex-grow">
          <h1 className="text-4xl">New</h1>
          <p className="text-neutral-400">
            Discover the latest submissions in the Hacker News community.
          </p>
        </div>
        <Footer />
      </div>
    </Provider>
  );
}

export default App;
