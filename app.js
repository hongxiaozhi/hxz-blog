const posts = JSON.parse(localStorage.getItem("hx_posts") || "[]");

const postListEl = document.getElementById("posts");
const titleEl = document.getElementById("title");
const contentEl = document.getElementById("content");

const render = () => {
  postListEl.innerHTML = "";
  if (posts.length === 0) {
    postListEl.innerHTML = '<div class="post-card">暂无笔记，赶紧写一篇吧。</div>';
    return;
  }

  posts.slice().reverse().forEach((post, index) => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p>${new Date(post.created).toLocaleString()}</p>
      <p>${escapeHtml(post.content).replace(/\n/g, "<br>")}</p>
    `;
    postListEl.appendChild(card);
  });
};

const save = () => {
  localStorage.setItem("hx_posts", JSON.stringify(posts));
};

const addPost = () => {
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    alert("标题和内容都不能为空");
    return;
  }

  posts.push({
    title,
    content,
    created: Date.now(),
  });

  save();
  render();

  titleEl.value = "";
  contentEl.value = "";
};

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

document.getElementById("publish").addEventListener("click", addPost);

render();
