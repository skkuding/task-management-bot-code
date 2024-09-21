import { Client } from "@notionhq/client";

export const code = async () => {
  const databaseId = process.env.NOTION_DATABASE_ID;

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  let pages = [];
  let hasMore = true;
  let startCursor = undefined;

  // 페이지를 모두 가져오기 위한 반복문
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
    });

    pages = [...pages, ...response.results]; // 새로운 페이지들을 배열에 추가
    hasMore = response.has_more; // 더 가져올 페이지가 있는지 확인
    startCursor = response.next_cursor; // 다음 페이지를 위한 커서 업데이트
  }

  return pages;
};
