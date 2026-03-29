const API_BASE = (location.port === '' || location.port === '80' || location.port === '443')
  ? `${location.protocol}//${location.hostname}/api`
  : `${location.protocol}//${location.hostname}:5000/api`;

const app = Vue.createApp({
  template: `
    <div class="container">
      <div class="app-header card">
        <span class="brand-mark">h_xiaozhi</span>
        <div class="center-search">
          <input class="center-search-input" v-model="searchQuery" placeholder="搜索标题或正文..." @keyup.enter="onSearchEnter" />
          <button class="center-search-btn" @click="applySearch">搜索</button>
        </div>
        <div class="user-area">
          <button class="user-area-trigger" @click.stop="toggleUserPanel">
            <span class="avatar-placeholder">{{ userInitial }}</span>
            <span class="user-status-text">{{ isLoggedIn ? username : '登录' }}</span>
          </button>
          <div class="user-popover" v-show="showUserPanel" @click.stop>
            <div v-if="!isLoggedIn" class="popover-section">
              <div class="popover-section-label">登录</div>
              <input v-model="loginForm.username" placeholder="用户名" />
              <input type="password" v-model="loginForm.password" placeholder="密码" @keyup.enter="loginFromPanel" />
              <div class="action-row" style="margin-top:10px">
                <button @click="loginFromPanel">登录</button>
              </div>
            </div>
            <div v-else>
              <div class="popover-section">
                <button @click="newPost(); closeUserPanel()">新建笔记</button>
              </div>
              <div class="popover-section secondary-actions">
                <div class="popover-section-label">更多操作</div>
                <button class="btn-secondary btn-small" @click="loadPosts(); closeUserPanel()">刷新笔记</button>
                <button class="btn-secondary btn-small" @click="toggleTheme">{{ theme === 'light' ? '切换深色' : '切换浅色' }}</button>
                <button class="btn-secondary btn-small" @click="logout(); closeUserPanel()">登出</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="message" class="notice header-notice">{{ message }}</div>
      </div>

      <div class="card" v-if="mode === 'list'">
        <h2 class="list-title">探索笔记</h2>
        <p class="label search-intro">先搜索，再筛选。输入关键词后按 Enter，或点击“应用筛选”获取结果。</p>

        <div class="search-primary">
          <input
            class="search-main"
            v-model="searchQuery"
            placeholder="搜索标题或正文"
            @keyup.enter="onSearchEnter"
          />
          <button class="search-btn" @click="applySearch">应用筛选</button>
        </div>

        <div class="filter-toolbar">
          <button class="btn-secondary btn-small" @click="toggleFilters">
            {{ filtersExpanded ? '收起筛选与排序' : '展开筛选与排序' }}
          </button>
          <button class="btn-secondary btn-small" @click="clearSearch">清除条件</button>
        </div>

        <div class="filter-panel" v-show="filtersExpanded">
          <div class="filter-grid">
            <div class="field-wrap">
              <label class="field-label">标签</label>
              <input v-model="searchTag" placeholder="例如：Vue / Flask" />
            </div>
            <div class="field-wrap">
              <label class="field-label">分类</label>
              <input v-model="searchCategory" placeholder="例如：开发日志" />
            </div>
            <div class="field-wrap">
              <label class="field-label">排序</label>
              <select v-model="sortOption">
                <option value="default">默认排序（置顶优先 + 最新）</option>
                <option value="views">按阅读量</option>
                <option value="oldest">最早发布</option>
              </select>
            </div>
          </div>
          <div class="action-row">
            <button @click="applySearch">应用筛选</button>
          </div>
        </div>

        <div v-if="isLoadingPosts" class="empty-state">正在加载笔记...</div>
        <div v-else-if="posts.length === 0" class="empty-state">没有匹配结果，调整条件后重新搜索。</div>

        <div class="post-list" v-else>
          <div class="post-card" v-for="post in posts" :key="post.id" :class="{pinned: post.is_pinned}">
            <div class="post-head">
              <h3>
                {{ post.title }}
                <span v-if="post.is_pinned" class="badge-pinned">置顶</span>
              </h3>
              <div class="label post-meta">{{ new Date(post.created_at).toLocaleString() }} · 阅读 {{ post.view_count }}</div>
            </div>
            <div class="post-tags-row">
              <span class="meta-chip">分类：{{ post.category || '未分类' }}</span>
              <span class="meta-chip">标签：{{ post.tags.join(', ') || '无' }}</span>
            </div>
            <div class="action-row">
              <button @click="openDetail(post)">查看</button>
              <button v-if="isLoggedIn" @click="edit(post)">编辑</button>
              <button v-if="isLoggedIn" class="btn-danger" @click="remove(post)">删除</button>
            </div>
          </div>
        </div>

        <div class="pagination">
          <button :disabled="postsPagination.page <= 1" @click="changePage(postsPagination.page - 1)">上一页</button>
          <button :disabled="postsPagination.page >= totalPagesDisplay" @click="changePage(postsPagination.page + 1)">下一页</button>
        </div>
      </div>

      <div class="card" v-if="mode === 'detail' && activePost">
        <div class="action-row">
          <button class="btn-secondary" @click="backToList">返回</button>
          <button v-if="isLoggedIn" @click="edit(activePost)">编辑</button>
        </div>
        <h2>{{ activePost.title }}</h2>
        <div class="label">{{ new Date(activePost.created_at).toLocaleString() }} · 阅读 {{ activePost.view_count }}</div>
        <div class="preview" v-html="activePost.html"></div>

        <div class="comment-section">
          <h3>评论</h3>
          <div class="comment-box" v-if="currentPostComments.length === 0">暂无评论，快来第一个发表吧。</div>
          <div class="comment-box" v-for="c in currentPostComments" :key="c.id">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div><strong>{{ c.author }}</strong> <span class="label">{{ new Date(c.created_at).toLocaleString() }}</span></div>
              <button v-if="isLoggedIn" class="btn-danger btn-small" @click="deleteComment(c)">删除</button>
            </div>
            <div>{{ c.content }}</div>
          </div>
          <div class="comment-editor">
            <input v-model="newComment.author" placeholder="昵称(可不填)" />
            <textarea v-model="newComment.content" rows="3" placeholder="写评论..."></textarea>
            <button @click="submitComment">发表评论</button>
          </div>
        </div>
      </div>

      <div class="card" v-if="mode === 'edit'">
        <button class="btn-secondary" @click="mode='list'">取消</button>
        <h2>{{ form.id ? '编辑笔记' : '新建笔记' }}</h2>
        <input v-model="form.title" placeholder="标题" />
        <input v-model="form.category" placeholder="分类" />
        <input v-model="form.tags" placeholder="标签，逗号分隔" />
        <textarea v-model="form.content" rows="10" placeholder="Markdown 内容"></textarea>
        <label class="toggle-line">置顶：<input type="checkbox" v-model="form.is_pinned" /></label>
        <div class="action-row">
          <button @click="save">保存</button>
        </div>
        <h3>Markdown 预览</h3>
        <div class="preview" v-html="markdownHtml"></div>
      </div>
    </div>
  `,
  data() {
    return {
      token: localStorage.getItem("hx_token") || "",
      username: localStorage.getItem("hx_user") || "",
      loginForm: { username: "", password: "" },
      posts: [],
      activePost: null,
      form: { id: null, title: "", content: "", tags: "", category: "" },
      mode: "list",
      message: "",
      searchQuery: "",
      searchTag: "",
      searchCategory: "",
      sortOption: "default",
      filtersExpanded: false,
      isMobileViewport: false,
      postsPagination: { page: 1, per_page: 5, total: 0, pages: 1 },
      theme: localStorage.getItem("hx_theme") || "light",
      isLoadingPosts: false,
      currentPostComments: [],
      newComment: { author: "", content: "" },
      showUserPanel: false,
    };
  },
  computed: {
    isLoggedIn() {
      return Boolean(this.token);
    },
    markdownHtml() {
      return marked.parse(this.form.content || "");
    },
    totalPagesDisplay() {
      return Math.max(1, this.postsPagination.pages || 1);
    },
    userInitial() {
      return this.isLoggedIn ? (this.username || '?')[0].toUpperCase() : '?';
    },
  },
  created() {
    this.setTheme(this.theme);
    this.loadPosts();
  },
  mounted() {
    this.syncViewport();
    this.filtersExpanded = this.isMobileViewport;
    window.addEventListener("resize", this.syncViewport);
    document.addEventListener("click", this.onGlobalClick);
    document.addEventListener("keydown", this.onGlobalKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.syncViewport);
    document.removeEventListener("click", this.onGlobalClick);
    document.removeEventListener("keydown", this.onGlobalKeydown);
  },
  methods: {
    toggleUserPanel() { this.showUserPanel = !this.showUserPanel; },
    closeUserPanel() { this.showUserPanel = false; },
    onGlobalClick() { this.showUserPanel = false; },
    onGlobalKeydown(e) { if (e.key === "Escape") this.showUserPanel = false; },
    async loginFromPanel() {
      await this.login();
      if (this.isLoggedIn) this.closeUserPanel();
    },
    setError(msg) { this.message = msg; setTimeout(() => (this.message = ""), 3200); },
    setTheme(theme) {
      const normalizedTheme = theme === "dark" ? "dark" : "light";
      this.theme = normalizedTheme;
      localStorage.setItem("hx_theme", normalizedTheme);
      document.body.classList.remove("light", "dark");
      document.body.classList.add(normalizedTheme);
    },
    async request(config) {
      const headers = { "Content-Type": "application/json" };
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
      try {
        const res = await axios({ baseURL: API_BASE, ...config, headers });
        return res.data;
      } catch (error) {
        const status = error.response?.status;
        const msg = error.response?.data?.msg || "";
        const expired = status === 401 && /expired/i.test(msg);

        if (expired) {
          this.logout();
          this.setError("登录已过期，请重新登录");
        }

        throw error;
      }
    },
    async login() {
      try {
        const data = await this.request({ url: "/auth/login", method: "POST", data: this.loginForm });
        this.token = data.access_token;
        this.username = data.username;
        localStorage.setItem("hx_token", this.token);
        localStorage.setItem("hx_user", this.username);
        this.mode = "list";
        this.loadPosts();
      } catch (error) {
        this.setError(error.response?.data?.msg || "登录失败");
      }
    },
    logout() {
      this.token = "";
      this.username = "";
      this.showUserPanel = false;
      localStorage.removeItem("hx_token");
      localStorage.removeItem("hx_user");
      this.mode = "list";
    },
    async loadPosts(page = 1) {
      const parsedPage = Number.parseInt(page, 10);
      const normalizedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
      this.isLoadingPosts = true;
      try {
        const params = [`page=${normalizedPage}`, `per_page=${this.postsPagination.per_page}`];
        if (this.searchQuery) params.push(`query=${encodeURIComponent(this.searchQuery)}`);
        if (this.searchTag) params.push(`tag=${encodeURIComponent(this.searchTag)}`);
        if (this.searchCategory) params.push(`category=${encodeURIComponent(this.searchCategory)}`);
        params.push(`sort=${encodeURIComponent(this.sortOption || "default")}`);
        const suffix = params.length ? `?${params.join("&")}` : "";
        const response = await this.request({ url: `/posts${suffix}`, method: "GET" });
        this.posts = response.items;
        this.postsPagination = {
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          pages: response.pages,
        };
      } catch (error) {
        this.setError("加载笔记失败");
      } finally {
        this.isLoadingPosts = false;
      }
    },
    applySearch() {
      this.loadPosts(1);
    },
    onSearchEnter() {
      this.loadPosts(1);
    },
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded;
    },
    syncViewport() {
      this.isMobileViewport = window.innerWidth <= 768;
    },
    clearSearch() {
      this.searchQuery = "";
      this.searchTag = "";
      this.searchCategory = "";
      this.sortOption = "default";
      this.loadPosts(1);
    },
    changePage(nextPage) {
      if (nextPage < 1 || nextPage > this.postsPagination.pages) return;
      this.loadPosts(nextPage);
    },
    toggleTheme() {
      this.setTheme(this.theme === "light" ? "dark" : "light");
    },
    edit(post) {
      this.mode = "edit";
      this.form = {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags.join(", "),
        category: post.category || "",
        is_pinned: post.is_pinned || false,
      };
    },
    newPost() {
      this.mode = "edit";
      this.form = { id: null, title: "", content: "", tags: "", category: "", is_pinned: false };
    },
    async save() {
      if (!this.form.title.trim() || !this.form.content.trim()) {
        this.setError("标题或内容不能为空");
        return;
      }
      try {
        const payload = {
          title: this.form.title,
          content: this.form.content,
          tags: this.form.tags,
          category: this.form.category,
          is_pinned: this.form.is_pinned || false,
        };
        if (this.form.id) {
          await this.request({ url: `/posts/${this.form.id}`, method: "PUT", data: payload });
          this.setError("更新成功");
        } else {
          await this.request({ url: "/posts", method: "POST", data: payload });
          this.setError("发布成功");
        }
        this.mode = "list";
        this.loadPosts();
      } catch (error) {
        this.setError(error.response?.data?.msg || "保存失败");
      }
    },
    async remove(post) {
      if (!confirm("确认删除该笔记吗？")) return;
      try {
        await this.request({ url: `/posts/${post.id}`, method: "DELETE" });
        this.setError("删除成功");
        this.loadPosts();
      } catch (error) {
        this.setError("删除失败");
      }
    },
    async openDetail(post) {
      try {
        const detail = await this.request({ url: `/posts/${post.id}`, method: "GET" });
        this.activePost = detail;
        this.mode = "detail";
        await this.loadComments(post.id);
      } catch (error) {
        this.setError("加载详情失败");
      }
    },
    async loadComments(postId) {
      try {
        this.currentPostComments = await this.request({ url: `/posts/${postId}/comments`, method: "GET" });
      } catch (error) {
        this.currentPostComments = [];
      }
    },
    async deleteComment(comment) {
      if (!this.activePost) return;
      if (!confirm('确定删除这条评论吗？')) return;
      try {
        await this.request({ url: `/posts/${this.activePost.id}/comments/${comment.id}`, method: "DELETE" });
        this.currentPostComments = this.currentPostComments.filter(c => c.id !== comment.id);
      } catch (error) {
        this.setError(error.response?.data?.msg || "删除评论失败");
      }
    },
    async submitComment() {
      if (!this.activePost) return;
      if (!this.newComment.content.trim()) {
        this.setError("评论内容不能为空");
        return;
      }
      try {
        await this.request({ url: `/posts/${this.activePost.id}/comments`, method: "POST", data: this.newComment });
        this.newComment = { author: "", content: "" };
        this.loadComments(this.activePost.id);
        this.setError("评论成功");
      } catch (error) {
        this.setError(error.response?.data?.msg || "发表评论失败");
      }
    },
    backToList() { this.mode = "list"; this.activePost = null; }
  }
});

app.mount("#app");
