import { Client } from "@notionhq/client";

export const code = async (inputs) => {
  const input = inputs.input;
  // Notion 클라이언트 초기화 (여기에 자신의 Notion API 토큰을 넣어주세요)
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });

  // 삭제할 Task 처리
  const deleteTasks = async (tasks) => {
    for (const task of tasks) {
      try {
        await notion.pages.update({
          page_id: task.page_id,
          archived: true, // 페이지를 삭제하는 대신 아카이브
        });
        console.log(`Deleted page: ${task.page_id}\n`);
      } catch (error) {
        console.error(`Failed to delete page: ${task.page_id}\n`, error);
      }
    }
  };

  // 코멘트 추가 처리
  const addComments = async (comments) => {
    for (const comment of comments) {
      try {
        const mention = comment.mentionedUser.map(() => {
          return {
            type: "mention",
            mention: { type: "user", user: comment.mentionedUser },
          };
        });
        // 댓글 추가를 위한 block 생성
        await notion.comments.create({
          parent: { page_id: comment.page_id },
          rich_text: [
            {
              type: "mention",
              mention: { type: "user", user: comment.mentionedUser },
            },
            { type: "text", text: { content: comment.comment_text } },
          ],
        });
        console.log(`Added comment to page: ${comment.page_id}\n`);
      } catch (error) {
        console.error(
          `Failed to add comment to page: ${comment.page_id}\n`,
          error
        );
      }
    }
  };
  const getDeletedMessage = (toDelete) => {
    let message = "삭제된 Task: ";
    message += `${toDelete.length}개\n\n`;
    for (const task of toDelete) {
      message += `- (${task.task_name})\r `;
    }
    return message;
  };
  const getCommentedMessage = (toComment) => {
    let message = `\n\n 댓글을 단 Task \n\n 필수 속성 미지정: ${toComment["NECESSARY_FIELD"].length}개 \n\n `;
    for (const comment of toComment["NECESSARY_FIELD"]) {
      message += `- [${comment.title}](${comment.url})\r`;
    }
    message += `\n\n 진행 중일때 필수 속성 미지정: ${toComment["ONGOING_NECESSARY_FIELD"].length}개 \n\n `;
    for (const comment of toComment["ONGOING_NECESSARY_FIELD"]) {
      message += `- [${comment.title}](${comment.url})\r`;
    }
    message += `\n\n 마감일 지남: ${toComment["DUE_DATE_PASSED"].length}개 \n\n`;
    for (const comment of toComment["DUE_DATE_PASSED"]) {
      message += `- [${comment.title}](${comment.url})\r`;
    }
    message += `\n\n 마감일 하루 전: ${toComment["ONE_DAY_LEFT"].length}개 \n\n`;
    for (const comment of toComment["ONE_DAY_LEFT"]) {
      message += `- [${comment.title}](${comment.url})\r`;
    }
    return message;
  };

  // toDelete 처리
  if (input.toDelete && input.toDelete.length > 0) {
    await deleteTasks(input.toDelete);
  }

  // toComment 처리
  if (input.toComment) {
    await addComments(input.toComment["NECESSARY_FIELD"]);
    await addComments(input.toComment["ONGOING_NECESSARY_FIELD"]);
    await addComments(input.toComment["DUE_DATE_PASSED"]);
    await addComments(input.toComment["ONE_DAY_LEFT"]);
  }

  return {
    status: "success",
    message: `${getDeletedMessage(input.toDelete)}${getCommentedMessage(
      input.toComment
    )}`,
  };
};
