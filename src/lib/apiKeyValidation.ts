export async function validateNvidiaApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey) {
    return { success: false, message: "NVIDIA API Key를 입력해 주세요." };
  }

  try {
    let res = await fetch("/api/nim/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.status === 404) {
      console.warn("Express backend proxy returned 404. Validating API Key directly against NVIDIA Chat API.");
      res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-8b-instruct",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1,
        }),
      });
    }

    if (res.ok) {
      return { success: true, message: "API Key 인증에 성공했습니다. NVIDIA NIM 호스트에 정상 연결되었습니다." };
    } else {
      const text = await res.text();
      return { success: false, message: `인증 오류 (상태 코드 ${res.status}): ${text.slice(0, 80)}` };
    }
  } catch (e: any) {
    console.error(e);
    return { success: false, message: e.message || "네트워크 연결 오류가 발생했습니다. 인터넷 설정을 확인해 주세요." };
  }
}
