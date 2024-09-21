import { Client } from "@notionhq/client";

export const code = async (inputs) => {
  // Notion 클라이언트 초기화
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  // Notion API를 통해 모든 유저 정보 가져오기
  const users = [];
  let hasMore = true;
  let cursor = undefined;

  while (hasMore) {
    // 유저 목록을 페이징 방식으로 가져오기
    const response = await notion.users.list({ start_cursor: cursor });

    // 유저 정보를 key-value 형식으로 저장
    response.results.forEach((user) => {
      // 'person' 속성이 있는 경우에만 이메일 정보를 포함
      const email =
        user.type === "person" && user.person?.email
          ? user.person.email
          : "No email available";

      users.push({
        user_id: user.id,
        info: {
          name: user.name,
          type: user.type,
          avatar_url: user.avatar_url,
          email: email,
        },
      });
    });

    // 페이징 처리
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }

  return users;
};
