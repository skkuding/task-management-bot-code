export const code = async (inputs) => {
  const tasks = inputs.output;
  const users = inputs.users;
  const currentDate = new Date();

  const shouldDeleteTaskByTitle = (title) => {
    return title === "작업" || !title;
  };

  const getUserNameById = (userId) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.info.name : "Unknown User";
  };

  const results = {
    toDelete: [],
    toComment: {
      NECESSARY_FIELD: [],
      ONGOING_NECESSARY_FIELD: [],
      DUE_DATE_PASSED: [],
      ONE_DAY_LEFT: [],
    },
  };

  tasks.forEach((data) => {
    const pageId = data.id;
    const taskTitle = data.properties["작업 이름"]?.title?.[0]?.plain_text;
    const creatorId = data.properties["생성자"]?.created_by?.id;
    const creatorName = getUserNameById(creatorId);
    const created_by = data.properties["생성자"]?.created_by;
    const dueDate = data.properties["마감일"]?.date?.start;
    const priority = data.properties["우선순위"]?.select;
    const teams = data.properties["팀"]?.multi_select;
    const status = data.properties["상태"]?.status?.name;
    const assignees = data.properties["담당자"]?.people;
    const tags = data.properties["태그"]?.multi_select;
    const epics = data.properties["Epic"]?.relation;
    const url = data.url;

    let commentText = "";

    if (shouldDeleteTaskByTitle(taskTitle)) {
      results.toDelete.push({
        page_id: pageId,
        task_name: taskTitle,
      });
      return;
    }

    if (status && (status === "백로그" || status === "완료")) {
      return;
    }

    if (!status || !teams?.length || !priority || !tags?.length) {
      commentText = `필수 속성(팀, 상태, 우선순위, 태그)을 모두 지정해주세요! [작업 이름: ${taskTitle}]`;
      results.toComment["NECESSARY_FIELD"].push({
        page_id: pageId,
        mentionedUser: [created_by],
        comment_text: commentText,
        title: taskTitle,
        url: url,
      });
    }

    // Check if it's a Task (not 시작 전 or Backlog or 완료)
    if (status && (status === "진행 중" || status === "리뷰 중")) {
      // Check if required fields are missing
      if (!epics.length || !dueDate || !assignees.length) {
        commentText = `진행중인 Task는 프로젝트, 담당자, 마감일을 모두 지정해주세요! [작업 이름: ${taskTitle}]`;
        results.toComment["ONGOING_NECESSARY_FIELD"].push({
          page_id: pageId,
          mentionedUser: [created_by],
          comment_text: commentText,
          title: taskTitle,
          url: url,
        });
      }

      // Check if due date has passed and status is '진행 중' or '리뷰 중'
      if (dueDate && new Date(dueDate) < currentDate) {
        // 마감일이 지남
        commentText = `마감일이 지났어요! 완료되었는지 확인해주시고, 완료되지 않았다면 마감일을 다시 설정해주세요. [작업 이름: ${taskTitle}]`;
        results.toComment["DUE_DATE_PASSED"].push({
          page_id: pageId,
          mentionedUser: assignees,
          comment_text: commentText,
          title: taskTitle,
          url: url,
        });
      }
      // if only one day left to due date, send a reminder
      else if (
        dueDate &&
        // @ts-ignore
        new Date(dueDate) - currentDate < 36 * 60 * 60 * 1000
      ) {
        commentText = `지정하신 마감일이 하루 남았어요! 🔥[작업 이름: ${taskTitle}]`;
        results.toComment["ONE_DAY_LEFT"].push({
          page_id: pageId,
          mentionedUser: assignees,
          comment_text: commentText,
          title: taskTitle,
          url: url,
        });
      }
    }
  });

  return results;
};
