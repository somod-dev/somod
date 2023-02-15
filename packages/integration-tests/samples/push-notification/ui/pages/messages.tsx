import { FunctionComponent, useReducer, useEffect } from "react";
import { subscribe } from "push-notification-ui";

const Messages: FunctionComponent = () => {
  const [messages, addMessage] = useReducer(
    (state: unknown[], data: unknown) => {
      return [...state, data];
    },
    []
  );

  useEffect(() => {
    subscribe(message => {
      addMessage(message);
    });
  }, []);

  return (
    <div style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
      <h1>Messages</h1>
      <ul>
        {messages.map((message, i) => (
          <li key={i}>
            <pre>{JSON.stringify(message, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Messages;
