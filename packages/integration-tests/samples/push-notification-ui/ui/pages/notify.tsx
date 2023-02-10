import { FunctionComponent, useReducer } from "react";
import { notify } from "../../lib/notify";

const Notify: FunctionComponent = () => {
  const [state, dispatch] = useReducer(
    (
      state: {
        message: string;
        userId: string;
        groupId: string;
        messageId?: string;
      },
      action: {
        type: "setMessage" | "setUserId" | "setGroupId" | "setMessageId";
        data: string;
      }
    ) => {
      switch (action.type) {
        case "setMessage":
          state.message = action.data;
          break;
        case "setUserId":
          state.userId = action.data;
          break;
        case "setGroupId":
          state.groupId = action.data;
          break;
        case "setMessageId":
          state.messageId = action.data;
      }
      return state;
    },
    {
      message: "",
      userId: "",
      groupId: ""
    }
  );

  const submit = () => {
    const data = {
      message: state.message,
      audience: {
        userId: state.userId || undefined,
        groupId: state.groupId || undefined
      }
    };

    notify(data).then(messageId => {
      dispatch({ type: "setMessageId", data: messageId });
    });
  };

  return (
    <form>
      <h1>Publish a Message</h1>
      <label htmlFor="message">Message</label>
      <textarea
        name="message"
        value={state.message}
        onChange={e => {
          dispatch({ type: "setMessage", data: e.target.value });
        }}
      />
      <label htmlFor="userId">UserId</label>
      <input
        name="userId"
        value={state.userId}
        onChange={e => {
          dispatch({ type: "setUserId", data: e.target.value });
        }}
      />
      <label htmlFor="groupId">GroupId</label>
      <input
        name="groupId"
        value={state.groupId}
        onChange={e => {
          dispatch({ type: "setGroupId", data: e.target.value });
        }}
      />

      {state.messageId ? (
        <h4>Mesasge published with id {state.messageId}</h4>
      ) : null}

      <button onClick={submit}>Submit</button>
    </form>
  );
};

export default Notify;
