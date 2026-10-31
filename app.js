
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const DB_NAME = "VideoShareDB";
const DB_VERSION = 1;
const STORE_NAME = "videos";
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

const state = {
    user: null,
    videos: [],
    language: localStorage.getItem("vs_language") || "vi",
    theme: localStorage.getItem("vs_theme") || "dark",
    guest: false,
    selectedDelete: null,
    currentVideoUrl: null,
    avatar: null
};

const TEXT = {
    vi: {
        entrySub: "Chia sẻ video cùng mọi người",
        joinServer: "Tham gia Discord Server",
        guestTab: "Khách",
        discordTitle: "Đăng nhập bằng Discord",
        discordDescription: "Sử dụng tài khoản Discord để đăng nhập an toàn vào VideoShare.",
        joinDiscord: "Đăng nhập với Discord",
        discordNote: "Bạn sẽ được chuyển đến Discord để xác nhận đăng nhập.",
        customName: "Tên hiển thị",
        joinCustom: "Vào ngay",
        guestNote: "Chế độ khách có thể bị giới hạn một số chức năng.",
        uploadBtn: "＋ Đăng video",
        darkMode: "Chế độ tối",
        language: "Ngôn ngữ",
        editProfile: "Chỉnh sửa hồ sơ",
        logout: "Đăng xuất",
        welcomeLabel: "KHÔNG GIAN CHIA SẺ VIDEO",
        welcome: "Chào mừng đến với",
        welcomeDescription: "Tải lên, lưu trữ và chia sẻ những video thú vị.",
        searchPlaceholder: "Tìm kiếm video...",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortName: "Tên A-Z",
        sortLargest: "Dung lượng lớn nhất",
        uploadEyebrow: "THƯ VIỆN CỦA BẠN",
        uploadTitle: "📤 Đăng video mới",
        dropTitle: "Kéo và thả video vào đây",
        dropSub: "Hoặc nhấn để chọn video từ máy tính",
        libraryEyebrow: "KHÁM PHÁ NỘI DUNG",
        library: "Thư viện video",
        emptyTitle: "Chưa có video nào",
        emptyLib: "Hãy đăng video đầu tiên của bạn!",
        uploadFirst: "Đăng video ngay",
        playingNow: "ĐANG PHÁT",
        save: "💾 Lưu thay đổi",
        cancel: "Hủy",
        confirmDeleteTitle: "Xóa video?",
        confirmDeleteText: "Bạn có chắc chắn muốn xóa video này không?",
        delete: "Xóa",
        loginRequired: "Bạn cần đăng nhập Discord để sử dụng chức năng này.",
        invalidName: "Tên hiển thị phải có từ 2 đến 24 ký tự.",
        uploadSuccess: "Đã tải video lên thành công!",
        uploadError: "Không thể tải video lên.",
        invalidVideo: "Tệp này không phải định dạng video được hỗ trợ.",
        videoTooLarge: "Video vượt quá giới hạn 500 MB.",
        deleteSuccess: "Đã xóa video.",
        deleteError: "Không thể xóa video.",
        profileSuccess: "Đã cập nhật hồ sơ.",
        profileError: "Không thể cập nhật hồ sơ.",
        avatarTooLarge: "Ảnh đại diện không được vượt quá 5 MB.",
        avatarInvalid: "Vui lòng chọn ảnh PNG, JPG hoặc WEBP.",
        emptySearch: "Không tìm thấy video phù hợp.",
        guestWelcome: "Bạn đang sử dụng chế độ khách.",
        loading: "Đang tải...",
        serverError: "Không thể kết nối máy chủ.",
        guestUpload: "Video ở chế độ khách chỉ được lưu trên trình duyệt này.",
        logoutConfirm: "Bạn đã đăng xuất."
    },
    en: {
        entrySub: "Share videos with everyone",
        joinServer: "Join Discord Server",
        guestTab: "Guest",
        discordTitle: "Sign in with Discord",
        discordDescription: "Use your Discord account to securely sign in to VideoShare.",
        joinDiscord: "Continue with Discord",
        discordNote: "You will be redirected to Discord to authorize access.",
        customName: "Display name",
        joinCustom: "Continue",
        guestNote: "Some features may be limited in guest mode.",
        uploadBtn: "＋ Upload video",
        darkMode: "Dark mode",
        language: "Language",
        editProfile: "Edit profile",
        logout: "Log out",
        welcomeLabel: "VIDEO SHARING SPACE",
        welcome: "Welcome to",
        welcomeDescription: "Upload, store and share interesting videos.",
        searchPlaceholder: "Search videos...",
        sortNewest: "Newest",
        sortOldest: "Oldest",
        sortName: "Name A-Z",
        sortLargest: "Largest",
        uploadEyebrow: "YOUR LIBRARY",
        uploadTitle: "📤 Upload new video",
        dropTitle: "Drag and drop videos here",
        dropSub: "Or click to select videos",
        libraryEyebrow: "EXPLORE CONTENT",
        library: "Video library",
        emptyTitle: "No videos yet",
        emptyLib: "Upload your first video!",
        uploadFirst: "Upload now",
        playingNow: "NOW PLAYING",
        save: "💾 Save changes",
        cancel: "Cancel",
        confirmDeleteTitle: "Delete video?",
        confirmDeleteText: "Are you sure you want to delete this video?",
        delete: "Delete",
        loginRequired: "Sign in with Discord to use this feature.",
        invalidName: "Display name must contain 2 to 24 characters.",
        uploadSuccess: "Video uploaded successfully!",
        uploadError: "Unable to upload video.",
        invalidVideo: "Unsupported video format.",
        videoTooLarge: "Video exceeds the 500 MB limit.",
        deleteSuccess: "Video deleted.",
        deleteError: "Unable to delete video.",
        profileSuccess: "Profile updated.",
        profileError: "Unable to update profile.",
        avatarTooLarge: "Avatar must not exceed 5 MB.",
        avatarInvalid: "Choose a PNG, JPG or WEBP image.",
        emptySearch: "No matching videos found.",
        guestWelcome: "You are using guest mode.",
        loading: "Loading...",
        serverError: "Unable to connect to the server.",
        guestUpload: "Guest videos are stored only in this browser.",
        logoutConfirm: "You have been logged out."
    }
};

function t(key)
{
    return TEXT[state.language]?.[key] || TEXT.vi[key] || key;
}

function toast(message)
{
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2800);
}

function setPage(page)
{
    $$(".page").forEach(element => element.classList.remove("active"));
    $(page)?.classList.add("active");
}

function applyTheme()
{
    document.documentElement.dataset.theme = state.theme;
    $("#theme-toggle")?.classList.toggle("on", state.theme === "dark");
    localStorage.setItem("vs_theme", state.theme);
}

function applyLanguage()
{
    document.documentElement.lang = state.language;

    $$("[data-i18n]").forEach(element =>
    {
        const key = element.dataset.i18n;
        if (TEXT[state.language][key]) element.textContent = t(key);
    });

    $$("[data-i18n-placeholder]").forEach(element =>
    {
        const key = element.dataset.i18nPlaceholder;
        if (TEXT[state.language][key]) element.placeholder = t(key);
    });

    $$("[data-lang]").forEach(button =>
    {
        button.classList.toggle("active", button.dataset.lang === state.language);
    });

    localStorage.setItem("vs_language", state.language);
    renderVideos();
}

function formatSize(bytes)
{
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
    return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDuration(seconds)
{
    if (!Number.isFinite(seconds)) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = Math.floor(seconds % 60);
    return hours
        ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
        : `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatDate(value)
{
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(state.language === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium"
    }).format(date);
}

function createAvatar(name)
{
    const letter = (name || "V").trim().charAt(0).toUpperCase() || "V";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="64" fill="#7c5cfc"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-size="64" font-family="Arial" fill="white">${letter.replace(/[<>&"]/g, "")}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getAvatar()
{
    return state.avatar || state.user?.avatar || createAvatar(state.user?.displayName);
}

function updateUserInterface()
{
    if (!state.user) return;

    const name = state.user.displayName || "VideoShare User";
    const avatar = getAvatar();

    $("#dd-name").textContent = name;
    $("#dd-tag").textContent = state.user.provider === "discord"
        ? "Discord Account"
        : "Guest Account";

    $("#nav-avatar").src = avatar;
    $("#avatar-preview").src = avatar;
    $("#profile-name").value = name;
}

function openDatabase()
{
    return new Promise((resolve, reject) =>
    {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () =>
        {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME))
            {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function databaseAction(mode, data)
{
    const db = await openDatabase();

    return new Promise((resolve, reject) =>
    {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let request;

        if (mode === "readonly" && data === "all")
        {
            request = store.getAll();
        }
        else if (mode === "readonly")
        {
            request = store.get(data);
        }
        else if (data?.action === "delete")
        {
            request = store.delete(data.id);
        }
        else
        {
            request = store.put(data);
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error);
    });
}

async function api(url, options = {})
{
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...options.headers
        }
    });

    if (response.status === 204) return null;

    const result = await response.json().catch(() => ({}));

    if (!response.ok)
    {
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    return result;
}

async function loadAccount()
{
    try
    {
        const result = await api("/api/me");

        if (result?.user)
        {
            state.user = {
                ...result.user,
                provider: "discord",
                displayName: result.user.displayName || result.user.username
            };

            state.guest = false;
            state.avatar = localStorage.getItem(`vs_avatar_${state.user.id}`) || null;
            setPage("#page-app");
            updateUserInterface();
            await loadVideos();
            return;
        }
    }
    catch (error)
    {
        if (!navigator.onLine) toast(t("serverError"));
    }

    const guest = sessionStorage.getItem("vs_guest");

    if (guest)
    {
        try
        {
            state.user = JSON.parse(guest);
            state.guest = true;
            state.avatar = localStorage.getItem("vs_guest_avatar") || null;
            setPage("#page-app");
            updateUserInterface();
            await loadVideos();
            return;
        }
        catch
        {
            sessionStorage.removeItem("vs_guest");
        }
    }

    setPage("#page-entry");
}

async function loadVideos()
{
    try
    {
        if (state.guest)
        {
            state.videos = await databaseAction("readonly", "all") || [];
        }
        else
        {
            const result = await api("/api/videos");
            state.videos = Array.isArray(result) ? result : result.videos || [];
        }

        renderVideos();
    }
    catch (error)
    {
        state.videos = [];
        renderVideos();
        toast(t("serverError"));
    }
}

function createElement(tag, className, text)
{
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createVideoCard(video)
{
    const card = createElement("article", "card");
    const thumb = createElement("div", "thumb-wrap");
    const image = createElement("img");
    const playOverlay = createElement("div", "play-overlay");
    const playCircle = createElement("div", "play-circle", "▶");
    const duration = createElement("span", "dur-badge", formatDuration(video.duration || 0));
    const body = createElement("div", "card-body");
    const title = createElement("h3", "card-title", video.title || video.name || "Untitled video");
    const meta = createElement("div", "card-meta");
    const uploader = createElement("div", "card-uploader");
    const uploaderAvatar = createElement("img");
    const uploaderName = createElement("span", "", video.uploaderName || video.uploader?.displayName || "Unknown");
    const actions = createElement("div", "card-actions");
    const playButton = createElement("button", "btn-sm btn-play", state.language === "vi" ? "▶ Xem video" : "▶ Watch");
    const deleteButton = createElement("button", "btn-sm btn-del", state.language === "vi" ? "🗑 Xóa" : "🗑 Delete");

    image.alt = video.title || "Video thumbnail";
    image.loading = "lazy";

    if (video.thumbnail)
    {
        image.src = video.thumbnail;
    }
    else if (video.thumbnailUrl)
    {
        image.src = video.thumbnailUrl;
    }
    else
    {
        image.src = createAvatar("▶");
    }

    uploaderAvatar.src = video.uploaderAvatar || createAvatar(uploaderName.textContent);

    thumb.append(image, playOverlay, duration);
    playOverlay.append(playCircle);

    meta.append(
        createElement("span", "", formatSize(video.size || 0)),
        createElement("span", "", formatDate(video.createdAt || video.date || Date.now()))
    );

    uploader.append(uploaderAvatar, uploaderName);
    body.append(title, meta, uploader);
    actions.append(playButton);

    const ownerId = video.ownerId || video.userId;
    const isOwner = state.guest
        ? video.ownerId === state.user.id
        : String(ownerId) === String(state.user.id);

    if (isOwner)
    {
        actions.append(deleteButton);
        deleteButton.addEventListener("click", () => askDelete(video.id));
    }

    thumb.addEventListener("click", () => playVideo(video));
    playButton.addEventListener("click", () => playVideo(video));

    card.append(thumb, body, actions);
    return card;
}

function renderVideos()
{
    const grid = $("#grid");
    if (!grid) return;

    grid.replaceChildren();

    const search = ($("#video-search")?.value || "").trim().toLowerCase();
    const sort = $("#video-sort")?.value || "newest";

    let videos = [...state.videos].filter(video =>
    {
        const title = (video.title || video.name || "").toLowerCase();
        const uploader = (video.uploaderName || video.uploader?.displayName || "").toLowerCase();
        return title.includes(search) || uploader.includes(search);
    });

    if (sort === "newest")
    {
        videos.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    }
    else if (sort === "oldest")
    {
        videos.sort((a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0));
    }
    else if (sort === "name")
    {
        videos.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    }
    else if (sort === "largest")
    {
        videos.sort((a, b) => (b.size || 0) - (a.size || 0));
    }

    $("#vid-count").textContent = videos.length;

    if (!videos.length)
    {
        const empty = createElement("div", "empty-state");
        const icon = createElement("div", "empty-icon", search ? "🔎" : "🗂️");
        const heading = createElement("h3", "", search ? t("emptySearch") : t("emptyTitle"));
        const description = createElement("p", "", search ? "" : t("emptyLib"));

        empty.append(icon, heading, description);

        if (!search)
        {
            const button = createElement("button", "btn-empty-upload", t("uploadFirst"));
            button.addEventListener("click", openUpload);
            empty.append(button);
        }

        grid.append(empty);
        return;
    }

    videos.forEach(video => grid.append(createVideoCard(video)));
}

function openUpload()
{
    if (!state.user) return;
    if (state.guest)
    {
        toast(t("guestUpload"));
    }

    $("#upload-section").hidden = false;
    $("#upload-section").scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeUpload()
{
    $("#upload-section").hidden = true;
    $("#file-input").value = "";
    $("#upload-progress").hidden = true;
}

function getVideoMetadata(file)
{
    return new Promise(resolve =>
    {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");

        video.preload = "metadata";
        video.muted = true;
        video.src = url;

        video.onloadedmetadata = () =>
        {
            const result = {
                duration: Number.isFinite(video.duration) ? video.duration : 0,
                width: video.videoWidth,
                height: video.videoHeight
            };

            URL.revokeObjectURL(url);
            resolve(result);
        };

        video.onerror = () =>
        {
            URL.revokeObjectURL(url);
            resolve({ duration: 0, width: 0, height: 0 });
        };
    });
}

async function createThumbnail(file)
{
    return new Promise(resolve =>
    {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");

        video.muted = true;
        video.preload = "metadata";
        video.src = url;

        video.onloadeddata = () =>
        {
            try
            {
                video.currentTime = Math.min(1, video.duration / 2);
            }
            catch
            {
                URL.revokeObjectURL(url);
                resolve(null);
            }
        };

        video.onseeked = () =>
        {
            try
            {
                const canvas = document.createElement("canvas");
                canvas.width = 480;
                canvas.height = Math.max(1, Math.round(480 * video.videoHeight / video.videoWidth));
                const context = canvas.getContext("2d");

                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob =>
                {
                    URL.revokeObjectURL(url);
                    resolve(blob);
                }, "image/jpeg", .75);
            }
            catch
            {
                URL.revokeObjectURL(url);
                resolve(null);
            }
        };

        video.onerror = () =>
        {
            URL.revokeObjectURL(url);
            resolve(null);
        };
    });
}

function validVideo(file)
{
    const extensions = /\.(mp4|webm|mov|mkv|avi)$/i;
    return file.type.startsWith("video/") || extensions.test(file.name);
}

async function uploadFiles(fileList)
{
    const files = [...fileList];
    if (!files.length) return;

    const progress = $("#upload-progress");
    const bar = $("#progress-bar");
    const text = $("#progress-text");

    progress.hidden = false;

    let completed = 0;
    let failed = 0;

    for (const file of files)
    {
        try
        {
            if (!validVideo(file))
            {
                failed++;
                toast(t("invalidVideo"));
                continue;
            }

            if (file.size > MAX_VIDEO_SIZE)
            {
                failed++;
                toast(t("videoTooLarge"));
                continue;
            }

            text.textContent = `${t("loading")} ${file.name}`;

            const metadata = await getVideoMetadata(file);
            const thumbnail = await createThumbnail(file);

            if (state.guest)
            {
                const video = {
                    id: crypto.randomUUID(),
                    title: file.name.replace(/\.[^.]+$/, ""),
                    name: file.name,
                    file,
                    thumbnail,
                    duration: metadata.duration,
                    width: metadata.width,
                    height: metadata.height,
                    size: file.size,
                    ownerId: state.user.id,
                    uploaderName: state.user.displayName,
                    uploaderAvatar: getAvatar(),
                    createdAt: new Date().toISOString()
                };

                await databaseAction("readwrite", video);
            }
            else
            {
                const form = new FormData();
                form.append("video", file);
                form.append("title", file.name.replace(/\.[^.]+$/, ""));
                form.append("duration", String(metadata.duration));

                if (thumbnail)
                {
                    form.append("thumbnail", thumbnail, "thumbnail.jpg");
                }

                await api("/api/videos", {
                    method: "POST",
                    body: form
                });
            }

            completed++;
        }
        catch (error)
        {
            failed++;
        }

        bar.style.width = `${Math.round((completed + failed) / files.length * 100)}%`;
    }

    await loadVideos();

    text.textContent = `${completed} / ${files.length}`;

    if (completed > 0) toast(t("uploadSuccess"));
    if (failed > 0) toast(`${failed} ${state.language === "vi" ? "video không thể tải lên" : "videos could not be uploaded"}`);

    setTimeout(() =>
    {
        progress.hidden = true;
        bar.style.width = "0%";
    }, 1800);

    $("#file-input").value = "";
}

async function getVideoSource(video)
{
    if (state.guest && video.file)
    {
        return URL.createObjectURL(video.file);
    }

    return video.url || video.videoUrl || `/uploads/${encodeURIComponent(video.filename || "")}`;
}

async function playVideo(video)
{
    try
    {
        const source = await getVideoSource(video);
        const player = $("#modal-video");

        if (state.currentVideoUrl)
        {
            URL.revokeObjectURL(state.currentVideoUrl);
            state.currentVideoUrl = null;
        }

        if (source.startsWith("blob:"))
        {
            state.currentVideoUrl = source;
        }

        player.pause();
        player.src = source;
        player.load();

        $("#modal-title").textContent = video.title || video.name || "Video";
        $("#modal-meta").textContent = `${formatSize(video.size || 0)} · ${formatDate(video.createdAt || video.date || Date.now())}`;

        $("#video-modal").classList.add("open");
        $("#video-modal").setAttribute("aria-hidden", "false");

        player.play().catch(() => {});
    }
    catch
    {
        toast(t("serverError"));
    }
}

function closeVideo()
{
    const modal = $("#video-modal");
    const player = $("#modal-video");

    player.pause();
    player.removeAttribute("src");
    player.load();

    if (state.currentVideoUrl)
    {
        URL.revokeObjectURL(state.currentVideoUrl);
        state.currentVideoUrl = null;
    }

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

function askDelete(id)
{
    state.selectedDelete = id;
    $("#confirm-modal").classList.add("open");
    $("#confirm-modal").setAttribute("aria-hidden", "false");
}

function closeDelete()
{
    state.selectedDelete = null;
    $("#confirm-modal").classList.remove("open");
    $("#confirm-modal").setAttribute("aria-hidden", "true");
}

async function deleteVideo()
{
    if (!state.selectedDelete) return;

    try
    {
        if (state.guest)
        {
            await databaseAction("readwrite", {
                action: "delete",
                id: state.selectedDelete
            });
        }
        else
        {
            await api(`/api/videos/${encodeURIComponent(state.selectedDelete)}`, {
                method: "DELETE"
            });
        }

        closeDelete();
        await loadVideos();
        toast(t("deleteSuccess"));
    }
    catch
    {
        toast(t("deleteError"));
    }
}

function openProfile()
{
    $("#dropdown").classList.remove("open");
    updateUserInterface();
    $("#profile-modal").classList.add("open");
    $("#profile-modal").setAttribute("aria-hidden", "false");
}

function closeProfile()
{
    $("#profile-modal").classList.remove("open");
    $("#profile-modal").setAttribute("aria-hidden", "true");
}

function resizeAvatar(file)
{
    return new Promise((resolve, reject) =>
    {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () =>
        {
            const canvas = document.createElement("canvas");
            const scale = Math.min(1, 256 / Math.max(image.width, image.height));

            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", .82));
        };

        image.onerror = () =>
        {
            URL.revokeObjectURL(url);
            reject(new Error("Invalid image"));
        };

        image.src = url;
    });
}

async function selectAvatar(file)
{
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    {
        toast(t("avatarInvalid"));
        return;
    }

    if (file.size > MAX_AVATAR_SIZE)
    {
        toast(t("avatarTooLarge"));
        return;
    }

    try
    {
        state.avatar = await resizeAvatar(file);
        $("#avatar-preview").src = state.avatar;
    }
    catch
    {
        toast(t("avatarInvalid"));
    }
}

async function saveProfile()
{
    const name = $("#profile-name").value.trim();

    if (name.length < 2 || name.length > 24)
    {
        toast(t("invalidName"));
        return;
    }

    try
    {
        if (state.guest)
        {
            state.user.displayName = name;
            sessionStorage.setItem("vs_guest", JSON.stringify(state.user));

            if (state.avatar)
            {
                localStorage.setItem("vs_guest_avatar", state.avatar);
            }
        }
        else
        {
            const result = await api("/api/me", {
                method: "PATCH",
                body: JSON.stringify({
                    displayName: name
                })
            });

            if (result?.user)
            {
                state.user = {
                    ...state.user,
                    ...result.user,
                    displayName: result.user.displayName || name
                };
            }
            else
            {
                state.user.displayName = name;
            }

            if (state.avatar)
            {
                localStorage.setItem(`vs_avatar_${state.user.id}`, state.avatar);
            }
        }

        updateUserInterface();
        closeProfile();
        toast(t("profileSuccess"));
        renderVideos();
    }
    catch
    {
        toast(t("profileError"));
    }
}

function openDropdown()
{
    $("#dropdown").classList.toggle("open");
}

function logout()
{
    if (state.guest)
    {
        sessionStorage.removeItem("vs_guest");
        state.user = null;
        state.guest = false;
        state.avatar = null;
        state.videos = [];
        setPage("#page-entry");
        toast(t("logoutConfirm"));
        return;
    }

    window.location.href = "/auth/logout";
}

function enterGuest()
{
    const name = $("#guest-name").value.trim();

    if (name.length < 2 || name.length > 24)
    {
        toast(t("invalidName"));
        return;
    }

    state.user = {
        id: `guest_${crypto.randomUUID()}`,
        displayName: name,
        provider: "guest"
    };

    state.guest = true;
    state.avatar = null;

    sessionStorage.setItem("vs_guest", JSON.stringify(state.user));

    setPage("#page-app");
    updateUserInterface();
    loadVideos();
    toast(t("guestWelcome"));
}

function initializeEvents()
{
    $$(".entry-tab").forEach(button =>
    {
        button.addEventListener("click", () =>
        {
            $$(".entry-tab").forEach(item => item.classList.remove("active"));
            $$(".entry-panel").forEach(item => item.classList.remove("active"));

            button.classList.add("active");
            $(`#panel-${button.dataset.tab}`)?.classList.add("active");
        });
    });

    $("#btn-guest-join").addEventListener("click", enterGuest);

    $("#guest-name").addEventListener("keydown", event =>
    {
        if (event.key === "Enter") enterGuest();
    });

    $("#btn-avatar-menu").addEventListener("click", openDropdown);

    $("#theme-toggle").addEventListener("click", () =>
    {
        state.theme = state.theme === "dark" ? "light" : "dark";
        applyTheme();
    });

    $$("[data-lang]").forEach(button =>
    {
        button.addEventListener("click", () =>
        {
            state.language = button.dataset.lang;
            applyLanguage();
        });
    });

    $("#btn-profile").addEventListener("click", openProfile);
    $("#btn-logout").addEventListener("click", logout);
    $("#btn-save-profile").addEventListener("click", saveProfile);
    $("#btn-cancel-profile").addEventListener("click", closeProfile);
    $("#btn-close-profile").addEventListener("click", closeProfile);

    $("#avatar-file-input").addEventListener("change", event =>
    {
        selectAvatar(event.target.files[0]);
    });

    $("#btn-open-upload").addEventListener("click", openUpload);
    $("#btn-empty-upload").addEventListener("click", openUpload);
    $("#btn-close-upload").addEventListener("click", closeUpload);

    $("#file-input").addEventListener("change", event =>
    {
        uploadFiles(event.target.files);
    });

    const dropZone = $("#drop-zone");

    ["dragenter", "dragover"].forEach(name =>
    {
        dropZone.addEventListener(name, event =>
        {
            event.preventDefault();
            dropZone.classList.add("over");
        });
    });

    ["dragleave", "drop"].forEach(name =>
    {
        dropZone.addEventListener(name, event =>
        {
            event.preventDefault();
            dropZone.classList.remove("over");
        });
    });

    dropZone.addEventListener("drop", event =>
    {
        uploadFiles(event.dataTransfer.files);
    });

    $("#video-search").addEventListener("input", renderVideos);
    $("#video-sort").addEventListener("change", renderVideos);

    $("#modal-close").addEventListener("click", closeVideo);

    $("#video-modal").addEventListener("click", event =>
    {
        if (event.target.id === "video-modal") closeVideo();
    });

    $("#btn-cancel-delete").addEventListener("click", closeDelete);
    $("#btn-confirm-delete").addEventListener("click", deleteVideo);

    $("#confirm-modal").addEventListener("click", event =>
    {
        if (event.target.id === "confirm-modal") closeDelete();
    });

    document.addEventListener("click", event =>
    {
        const dropdown = $("#dropdown");
        const avatarButton = $("#btn-avatar-menu");

        if (!dropdown.contains(event.target) && !avatarButton.contains(event.target))
        {
            dropdown.classList.remove("open");
        }
    });

    document.addEventListener("keydown", event =>
    {
        if (event.key === "Escape")
        {
            closeVideo();
            closeProfile();
            closeDelete();
            $("#dropdown").classList.remove("open");
        }
    });
}

async function initialize()
{
    applyTheme();
    applyLanguage();
    initializeEvents();
    await loadAccount();
}

initialize();

