import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  getPosts,
  createPost as storageCreatePost,
  toggleLike as storageToggleLike,
  deletePost as storageDeletePost,
  getComments,
  addComment as storageAddComment,
  getUsername,
  setUsername as storageSetUsername,
  Post,
  Comment,
} from "@/lib/storage";

interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  username: string;
  refreshPosts: () => Promise<void>;
  createPost: (
    post: Omit<Post, "id" | "likeCount" | "liked" | "commentCount" | "createdAt">
  ) => Promise<Post>;
  toggleLike: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  loadComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  setUsername: (name: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsernameState] = useState("User");

  const refreshPosts = useCallback(async () => {
    setLoading(true);
    const data = await getPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshPosts();
    getUsername().then(setUsernameState);
  }, [refreshPosts]);

  const handleCreatePost = useCallback(
    async (
      post: Omit<Post, "id" | "likeCount" | "liked" | "commentCount" | "createdAt">
    ) => {
      const newPost = await storageCreatePost(post);
      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    },
    []
  );

  const handleToggleLike = useCallback(async (postId: string) => {
    const updated = await storageToggleLike(postId);
    if (updated) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? updated : p))
      );
    }
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    await storageDeletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    return await getComments(postId);
  }, []);

  const handleAddComment = useCallback(
    async (postId: string, content: string) => {
      const comment = await storageAddComment(postId, username, content);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        )
      );
      return comment;
    },
    [username]
  );

  const handleSetUsername = useCallback(async (name: string) => {
    await storageSetUsername(name);
    setUsernameState(name);
  }, []);

  const value = useMemo(
    () => ({
      posts,
      loading,
      username,
      refreshPosts,
      createPost: handleCreatePost,
      toggleLike: handleToggleLike,
      deletePost: handleDeletePost,
      loadComments,
      addComment: handleAddComment,
      setUsername: handleSetUsername,
    }),
    [
      posts,
      loading,
      username,
      refreshPosts,
      handleCreatePost,
      handleToggleLike,
      handleDeletePost,
      loadComments,
      handleAddComment,
      handleSetUsername,
    ]
  );

  return (
    <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostsProvider");
  }
  return context;
}
