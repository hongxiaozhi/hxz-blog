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
        <div v-if="message" class="notice header-notice" :class="`notice-${messageType}`">{{ message }}</div>
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

        <div class="list-summary" v-if="!isLoadingPosts || posts.length > 0">
          <span class="label">{{ listStatusText }}</span>
        </div>

        <div v-if="isLoadingPosts" class="empty-state">
          <div class="empty-state-title">正在加载笔记...</div>
          <div class="empty-state-body">列表、筛选和排序结果正在准备中。</div>
        </div>
        <div v-else-if="posts.length === 0" class="empty-state">
          <div class="empty-state-title">没有匹配结果</div>
          <div class="empty-state-body">可以清除筛选条件后重新查看全部内容。</div>
          <button class="btn-secondary btn-small" style="margin-top:10px" @click="clearSearch">重置筛选条件</button>
        </div>

        <div class="post-list" v-else>
          <div class="post-card" v-for="post in posts" :key="post.id" :class="{pinned: post.is_pinned}">
            <div class="post-head">
              <h3>
                {{ post.title }}
                <span v-if="post.is_pinned" class="badge-pinned">置顶</span>
              </h3>
              <div class="label post-meta">{{ new Date(post.created_at).toLocaleString() }} · 阅读 {{ post.view_count }}</div>
            </div>
            <p class="post-excerpt">{{ getPostExcerpt(post.content) }}</p>
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

        <div class="load-more-row" v-if="!isLoadingPosts && posts.length > 0">
          <button v-if="hasMore" class="btn-secondary" @click="loadMore" :disabled="isLoadingMore">{{ isLoadingMore ? '加载中...' : '加载更多' }}</button>
          <span class="label">{{ hasMore ? `共 ${postsPagination.total} 篇，已显示 ${posts.length} 篇` : `已显示全部 ${posts.length} 篇结果` }}</span>
        </div>
      </div>

      <div class="card" v-if="mode === 'detail' && activePost">
        <div class="detail-topbar">
          <div class="action-row">
            <button class="btn-secondary" @click="backToList">返回列表</button>
            <button v-if="isLoggedIn" @click="edit(activePost)">编辑本文</button>
          </div>
          <span class="label">发布时间 {{ formatDate(activePost.created_at) }}</span>
        </div>
        <div class="detail-hero">
          <h2>{{ activePost.title }}</h2>
          <p class="detail-subtitle">适合沉浸阅读的完整正文与评论讨论。</p>
          <div class="detail-meta">
            <span class="meta-chip">阅读 {{ activePost.view_count }}</span>
            <span class="meta-chip">分类：{{ activePost.category || '未分类' }}</span>
            <span class="meta-chip">标签：{{ activePost.tags.join(', ') || '无' }}</span>
            <span class="meta-chip">更新于 {{ formatDate(activePost.updated_at || activePost.created_at) }}</span>
          </div>
        </div>
        <div class="preview detail-preview" v-html="activePost.html"></div>

        <div class="comment-section">
          <div class="section-heading">
            <div>
              <h3>评论</h3>
              <p class="label">{{ commentsSummaryText }}</p>
            </div>
            <button class="btn-secondary btn-small" @click="loadComments(activePost.id, true)" :disabled="isLoadingComments">
              {{ isLoadingComments ? '刷新中...' : '刷新评论' }}
            </button>
          </div>

          <div class="empty-state" v-if="commentsError">
            <div class="empty-state-title">评论加载失败</div>
            <div class="empty-state-body">{{ commentsError }}</div>
            <button class="btn-secondary btn-small" style="margin-top:10px" @click="loadComments(activePost.id, true)">重试</button>
          </div>

          <div class="comment-box comment-status" v-else-if="isLoadingComments">评论加载中...</div>
          <div class="comment-box comment-status" v-else-if="currentPostComments.length === 0">暂无评论，快来第一个发表吧。</div>
          <div class="comment-box" v-for="c in currentPostComments" :key="c.id">
            <div class="comment-header">
              <div><strong>{{ c.author }}</strong> <span class="label">{{ formatDate(c.created_at) }}</span></div>
              <button v-if="isLoggedIn" class="btn-danger btn-small" @click="deleteComment(c)">删除</button>
            </div>
            <div>{{ c.content }}</div>
          </div>
          <div class="comment-editor">
            <div v-if="!commentEditorExpanded" class="comment-editor-collapsed" @click="commentEditorExpanded = true">写下你的想法...</div>
            <template v-else>
              <div class="label comment-form-hint">评论支持匿名发布，提交后会立即刷新列表。</div>
              <input v-model="newComment.author" placeholder="昵称(可不填)" />
              <textarea v-model="newComment.content" rows="3" placeholder="写评论..."></textarea>
              <div class="action-row comment-actions" style="margin-top:8px">
                <button @click="submitComment" :disabled="isSubmittingComment">{{ isSubmittingComment ? '提交中...' : '发表评论' }}</button>
                <button class="btn-secondary btn-small" @click="commentEditorExpanded = false">取消</button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="card" v-if="mode === 'edit'">
        <div class="editor-shell">
          <div class="editor-toolbar">
            <div>
              <div class="label">v1.4 编辑效率优化</div>
              <h2>{{ form.id ? '编辑笔记' : '新建笔记' }}</h2>
              <p class="editor-intro">在输入与预览之间快速切换，保持保存入口始终稳定可见。</p>
            </div>
            <div class="editor-toolbar-actions">
              <button class="btn-secondary btn-small" @click="setEditorLayout('split')" :disabled="isMobileViewport">双栏</button>
              <button class="btn-secondary btn-small" @click="setEditorLayout('stacked')">单栏</button>
              <button class="btn-secondary" @click="cancelEdit">取消</button>
              <button @click="save" :disabled="isSavingPost">{{ isSavingPost ? '保存中...' : '保存' }}</button>
            </div>
          </div>

          <div class="editor-status-bar">
            <span class="label">{{ editorLayoutLabel }}</span>
            <span class="label">{{ editorStatusText }}</span>
          </div>

          <div class="editor-grid" :class="editorLayoutClass">
            <div class="editor-pane">
              <div class="editor-section-header">
                <h3>编辑内容</h3>
                <span class="label">支持 Markdown，预览实时同步。</span>
              </div>
              <div class="editor-form-grid">
                <div class="field-wrap editor-field-wide">
                  <label class="field-label">标题</label>
                  <input v-model="form.title" placeholder="输入标题" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">分类</label>
                  <input v-model="form.category" placeholder="例如：开发日志" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">标签</label>
                  <input v-model="form.tags" placeholder="标签，逗号分隔" />
                </div>
              </div>
              <label class="toggle-line">置顶：<input type="checkbox" v-model="form.is_pinned" /></label>
              <textarea class="editor-textarea" v-model="form.content" rows="18" placeholder="Markdown 内容"></textarea>
            </div>

            <div class="editor-pane editor-preview-pane">
              <div class="editor-section-header">
                <h3>Markdown 预览</h3>
                <span class="label">预计字数 {{ editorWordCount }}，字符 {{ editorCharacterCount }}{{ lastSavedAtLabel ? ` · ${lastSavedAtLabel}` : '' }}</span>
              </div>
              <div class="preview editor-preview" v-html="markdownHtml"></div>
            </div>
          </div>
        </div>
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
      messageType: "error",
      searchQuery: "",
      searchTag: "",
      searchCategory: "",
      sortOption: "default",
      filtersExpanded: false,
      isMobileViewport: false,
      postsPagination: { page: 1, per_page: 5, total: 0, pages: 1 },
      theme: localStorage.getItem("hx_theme") || "light",
      isLoadingPosts: false,
      currentPage: 1,
      hasMore: false,
      isLoadingMore: false,
      commentEditorExpanded: false,
      isSubmittingComment: false,
      isLoadingComments: false,
      commentsError: "",
      currentPostComments: [],
      newComment: { author: "", content: "" },
      showUserPanel: false,
      editorLayout: localStorage.getItem("hx_editor_layout") || "split",
      isSavingPost: false,
      initialFormSnapshot: "",
      lastSavedAt: "",
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
    listStatusText() {
      if (this.isLoadingPosts) return "列表加载中，请稍候。";
      if (this.posts.length === 0) return "当前没有可展示的结果。";
      if (this.hasMore) return `当前显示 ${this.posts.length} / ${this.postsPagination.total} 篇，可继续加载更多。`;
      return `已完整显示 ${this.posts.length} 篇结果。`;
    },
    commentsSummaryText() {
      if (this.commentsError) return "评论暂时不可用，可稍后重试。";
      if (this.isLoadingComments) return "正在同步最新评论。";
      if (this.currentPostComments.length === 0) return "还没有评论。";
      return `共 ${this.currentPostComments.length} 条评论，按时间倒序显示。`;
    },
    editorLayoutClass() {
      return this.editorLayout === "split" && !this.isMobileViewport ? "editor-grid-split" : "editor-grid-stacked";
    },
    editorLayoutLabel() {
      if (this.isMobileViewport) return "当前为移动端单栏编辑布局。";
      return this.editorLayout === "split" ? "当前为双栏编辑布局。" : "当前为单栏编辑布局。";
    },
    editorStatusText() {
      if (this.isSavingPost) return "保存进行中，请稍候。";
      if (this.hasUnsavedChanges) return "当前有未保存变更，可使用 Ctrl/Cmd + S 快速保存。";
      if (!this.form.title.trim() && !this.form.content.trim()) return "尚未开始编辑内容。";
      if (!this.form.title.trim()) return "建议先补充标题，保存会更顺畅。";
      if (!this.form.content.trim()) return "正文为空，当前仅编辑了基础信息。";
      return "正文与预览已保持同步，可直接保存。";
    },
    editorWordCount() {
      const text = (this.form.content || "").trim();
      return text ? text.split(/\s+/).filter(Boolean).length : 0;
    },
    editorCharacterCount() {
      return (this.form.content || "").trim().length;
    },
    hasUnsavedChanges() {
      return this.mode === "edit" && this.getFormSnapshot() !== this.initialFormSnapshot;
    },
    lastSavedAtLabel() {
      return this.lastSavedAt ? `上次保存于 ${this.lastSavedAt}` : "";
    },
  },
  watch: {
    activePost(newVal) {
      if (newVal && typeof hljs !== 'undefined') {
        this.$nextTick(() => hljs.highlightAll());
      }
    },
    markdownHtml() {
      if (this.mode === 'edit' && typeof hljs !== 'undefined') {
        this.$nextTick(() => hljs.highlightAll());
      }
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
    window.addEventListener("beforeunload", this.onBeforeUnload);
    document.addEventListener("click", this.onGlobalClick);
    document.addEventListener("keydown", this.onGlobalKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.syncViewport);
    window.removeEventListener("beforeunload", this.onBeforeUnload);
    document.removeEventListener("click", this.onGlobalClick);
    document.removeEventListener("keydown", this.onGlobalKeydown);
  },
  methods: {
    toggleUserPanel() { this.showUserPanel = !this.showUserPanel; },
    closeUserPanel() { this.showUserPanel = false; },
    onGlobalClick() { this.showUserPanel = false; },
    onGlobalKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && this.mode === "edit") {
        e.preventDefault();
        if (!this.isSavingPost) this.save();
        return;
      }
      if (e.key === "Escape") this.showUserPanel = false;
    },
    onBeforeUnload(e) {
      if (!this.hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    },
    async loginFromPanel() {
      await this.login();
      if (this.isLoggedIn) this.closeUserPanel();
    },
    showMessage(msg, type = "error") {
      this.message = msg;
      this.messageType = type;
      setTimeout(() => {
        if (this.message === msg) this.message = "";
      }, 3200);
    },
    setError(msg) { this.showMessage(msg, "error"); },
    setSuccess(msg) { this.showMessage(msg, "success"); },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
    getPostExcerpt(content) {
      const normalized = (content || "").replace(/[#>*`_\-\n]/g, " ").replace(/\s+/g, " ").trim();
      if (!normalized) return "这篇笔记还没有摘要内容。";
      return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
    },
    getFormSnapshot() {
      return JSON.stringify({
        id: this.form.id,
        title: (this.form.title || "").trim(),
        content: this.form.content || "",
        tags: (this.form.tags || "").trim(),
        category: (this.form.category || "").trim(),
        is_pinned: Boolean(this.form.is_pinned),
      });
    },
    markEditorSaved() {
      this.initialFormSnapshot = this.getFormSnapshot();
      this.lastSavedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
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
        const expired = status === 401 && /过期|expired/i.test(msg);

        if (expired) {
          this.logout();
          this.setError("登录已过期，请重新登录");
        } else if (status === 401 && /无效|失效/i.test(msg)) {
          this.logout();
          this.setError(msg);
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
        this.setSuccess("登录成功");
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
    async loadPosts(page = 1, append = false) {
      const parsedPage = Number.parseInt(page, 10);
      const normalizedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
      if (!append) this.isLoadingPosts = true;
      try {
        const params = [`page=${normalizedPage}`, `per_page=${this.postsPagination.per_page}`];
        if (this.searchQuery) params.push(`query=${encodeURIComponent(this.searchQuery)}`);
        if (this.searchTag) params.push(`tag=${encodeURIComponent(this.searchTag)}`);
        if (this.searchCategory) params.push(`category=${encodeURIComponent(this.searchCategory)}`);
        params.push(`sort=${encodeURIComponent(this.sortOption || "default")}`);
        const suffix = params.length ? `?${params.join("&")}` : "";
        const response = await this.request({ url: `/posts${suffix}`, method: "GET" });
        if (append) {
          this.posts = [...this.posts, ...response.items];
        } else {
          this.posts = response.items;
        }
        this.currentPage = response.page;
        this.hasMore = response.page < response.pages;
        this.postsPagination = {
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          pages: response.pages,
        };
      } catch (error) {
        this.posts = append ? this.posts : [];
        this.hasMore = false;
        this.setError(error.response?.data?.msg || "加载笔记失败");
      } finally {
        if (!append) this.isLoadingPosts = false;
      }
    },
    async loadMore() {
      if (!this.hasMore || this.isLoadingMore) return;
      this.isLoadingMore = true;
      try {
        await this.loadPosts(this.currentPage + 1, true);
      } finally {
        this.isLoadingMore = false;
      }
    },
    applySearch() {
      this.posts = [];
      this.loadPosts(1);
    },
    onSearchEnter() {
      this.posts = [];
      this.loadPosts(1);
    },
    toggleFilters() {
      this.filtersExpanded = !this.filtersExpanded;
    },
    syncViewport() {
      this.isMobileViewport = window.innerWidth <= 768;
      if (this.isMobileViewport) this.editorLayout = "stacked";
    },
    setEditorLayout(layout) {
      const nextLayout = layout === "split" ? "split" : "stacked";
      this.editorLayout = this.isMobileViewport ? "stacked" : nextLayout;
      localStorage.setItem("hx_editor_layout", this.editorLayout);
    },
    clearSearch() {
      this.searchQuery = "";
      this.searchTag = "";
      this.searchCategory = "";
      this.sortOption = "default";
      this.posts = [];
      this.loadPosts(1);
    },
    toggleTheme() {
      this.setTheme(this.theme === "light" ? "dark" : "light");
    },
    edit(post) {
      this.mode = "edit";
      this.setEditorLayout(this.editorLayout);
      this.form = {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags.join(", "),
        category: post.category || "",
        is_pinned: post.is_pinned || false,
      };
      this.lastSavedAt = "";
      this.$nextTick(() => {
        this.initialFormSnapshot = this.getFormSnapshot();
      });
    },
    newPost() {
      this.mode = "edit";
      this.setEditorLayout(this.editorLayout);
      this.form = { id: null, title: "", content: "", tags: "", category: "", is_pinned: false };
      this.lastSavedAt = "";
      this.$nextTick(() => {
        this.initialFormSnapshot = this.getFormSnapshot();
      });
    },
    cancelEdit() {
      if (this.hasUnsavedChanges && !confirm("当前有未保存内容，确定离开编辑页吗？")) return;
      this.mode = "list";
      this.lastSavedAt = "";
    },
    async save() {
      if (!this.form.title.trim() || !this.form.content.trim()) {
        this.setError("标题或内容不能为空");
        return;
      }
      this.isSavingPost = true;
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
          this.setSuccess("更新成功");
        } else {
          await this.request({ url: "/posts", method: "POST", data: payload });
          this.setSuccess("发布成功");
        }
        this.markEditorSaved();
        this.mode = "list";
        this.loadPosts();
      } catch (error) {
        this.setError(error.response?.data?.msg || "保存失败");
      } finally {
        this.isSavingPost = false;
      }
    },
    async remove(post) {
      if (!confirm("确认删除该笔记吗？")) return;
      try {
        await this.request({ url: `/posts/${post.id}`, method: "DELETE" });
        this.setSuccess("删除成功");
        this.loadPosts();
      } catch (error) {
        this.setError(error.response?.data?.msg || "删除失败");
      }
    },
    async openDetail(post) {
      try {
        const detail = await this.request({ url: `/posts/${post.id}`, method: "GET" });
        this.activePost = detail;
        this.commentEditorExpanded = false;
        this.mode = "detail";
        await this.loadComments(post.id);
      } catch (error) {
        this.setError(error.response?.data?.msg || "加载详情失败");
      }
    },
    async loadComments(postId, silent = false) {
      this.commentsError = "";
      this.isLoadingComments = true;
      try {
        this.currentPostComments = await this.request({ url: `/posts/${postId}/comments`, method: "GET" });
      } catch (error) {
        this.currentPostComments = [];
        this.commentsError = error.response?.data?.msg || "评论暂时无法加载，请稍后重试";
      } finally {
        this.isLoadingComments = false;
      }
    },
    async deleteComment(comment) {
      if (!this.activePost) return;
      if (!confirm('确定删除这条评论吗？')) return;
      try {
        await this.request({ url: `/posts/${this.activePost.id}/comments/${comment.id}`, method: "DELETE" });
        this.currentPostComments = this.currentPostComments.filter(c => c.id !== comment.id);
        this.setSuccess("评论已删除");
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
      this.isSubmittingComment = true;
      try {
        await this.request({ url: `/posts/${this.activePost.id}/comments`, method: "POST", data: this.newComment });
        this.newComment = { author: "", content: "" };
        this.commentEditorExpanded = false;
        await this.loadComments(this.activePost.id, true);
        this.setSuccess("评论成功");
      } catch (error) {
        this.setError(error.response?.data?.msg || "发表评论失败");
      } finally {
        this.isSubmittingComment = false;
      }
    },
    backToList() { this.mode = "list"; this.activePost = null; this.commentEditorExpanded = false; }
  }
});

app.mount("#app");
