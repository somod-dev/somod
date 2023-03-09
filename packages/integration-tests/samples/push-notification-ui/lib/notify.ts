export const notify = async (data: {
  message: string;
  audience: {
    userId?: string;
    groupId?: string;
  };
}): Promise<string> => {
  const res = await fetch(
    process.env.NEXT_PUBLIC_PNS_PUBLISH_ENDPOINT + "/notify",
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    }
  );
  if (res.status != 200) {
    throw new Error("Notify failed : " + res.status);
  }
  const result = await res.json();
  return result.messageId;
};
