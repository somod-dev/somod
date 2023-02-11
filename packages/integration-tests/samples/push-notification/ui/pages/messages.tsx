import { FunctionComponent, useReducer, useEffect } from "react";
import { subscribe } from "push-notification-ui";

const Messages: FunctionComponent = () => {
  const [messages, addMessage] = useReducer(
    (state: unknown[], data: unknown) => {
      state.push(data);
      return state;
    },
    []
  );

  useEffect(() => {
    subscribe(message => {
      addMessage(message);
    });
  }, []);

  return (
    <>
      <h1>Messages</h1>
      <ul>
        {messages.map((message, i) => (
          <li key={i}>{JSON.stringify(message, null, 2)}</li>
        ))}
      </ul>
    </>
  );
};

export default Messages;
