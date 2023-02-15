import { FunctionComponent, useReducer, MouseEventHandler } from "react";
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
        field: "message" | "userId" | "groupId" | "messageId";
        data: string;
      }
    ) => {
      return { ...state, [action.field]: action.data };
    },
    {
      message: "",
      userId: "",
      groupId: ""
    }
  );

  const submit: MouseEventHandler = e => {
    e.preventDefault();
    const data = {
      message: state.message,
      audience: {
        userId: state.userId || undefined,
        groupId: state.groupId || undefined
      }
    };

    notify(data).then(messageId => {
      dispatch({ field: "messageId", data: messageId });
    });
  };

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "500px",
        fontFamily: "Roboto, Arial, sans-serif"
      }}
    >
      <h1>Publish a Message</h1>

      <div
        style={{ display: "flex", flexDirection: "column", margin: "5px 0px" }}
      >
        <label htmlFor="message">Message</label>
        <textarea
          name="message"
          value={state.message}
          onChange={e => {
            dispatch({ field: "message", data: e.target.value });
          }}
          rows={5}
        />
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", margin: "5px 0px" }}
      >
        <label htmlFor="userId">UserId</label>
        <input
          name="userId"
          value={state.userId}
          onChange={e => {
            dispatch({ field: "userId", data: e.target.value });
          }}
        />
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", margin: "5px 0px" }}
      >
        <label htmlFor="groupId">GroupId</label>
        <input
          name="groupId"
          value={state.groupId}
          onChange={e => {
            dispatch({ field: "groupId", data: e.target.value });
          }}
        />
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", margin: "5px 0px" }}
      >
        {state.messageId ? (
          <h4>
            Mesasge published with id <br />
            {state.messageId}
          </h4>
        ) : null}
      </div>
      <button onClick={submit} style={{ margin: "5px 0px", padding: "5px" }}>
        Submit
      </button>
    </form>
  );
};

export default Notify;
