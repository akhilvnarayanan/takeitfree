import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface Post {
  id: string;
  username: string;
  caption: string;
  postType: "giving" | "looking" | "community";
  images: string[];
  likeCount: number;
  liked: boolean;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  username: string;
  content: string;
  createdAt: string;
}

const POSTS_KEY = "takeitfree_posts";
const COMMENTS_KEY = "takeitfree_comments";
const USERNAME_KEY = "takeitfree_username";

export async function getUsername(): Promise<string> {
  const stored = await AsyncStorage.getItem(USERNAME_KEY);
  if (stored) return stored;
  const name = "User" + Math.floor(Math.random() * 9000 + 1000);
  await AsyncStorage.setItem(USERNAME_KEY, name);
  return name;
}

export async function setUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(USERNAME_KEY, name);
}

export async function getPosts(): Promise<Post[]> {
  const raw = await AsyncStorage.getItem(POSTS_KEY);
  if (!raw) return getSeedPosts();
  const posts = JSON.parse(raw) as Post[];
  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createPost(
  post: Omit<Post, "id" | "likeCount" | "liked" | "commentCount" | "createdAt">
): Promise<Post> {
  const posts = await getPosts();
  const newPost: Post = {
    ...post,
    id: Crypto.randomUUID(),
    likeCount: 0,
    liked: false,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  };
  posts.unshift(newPost);
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return newPost;
}

export async function toggleLike(postId: string): Promise<Post | null> {
  const posts = await getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  post.liked = !post.liked;
  post.likeCount += post.liked ? 1 : -1;
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return post;
}

export async function deletePost(postId: string): Promise<void> {
  const posts = await getPosts();
  const filtered = posts.filter((p) => p.id !== postId);
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
  const comments = await getComments(postId);
  if (comments.length > 0) {
    const allComments = await getAllComments();
    const remaining = allComments.filter((c) => c.postId !== postId);
    await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(remaining));
  }
}

async function getAllComments(): Promise<Comment[]> {
  const raw = await AsyncStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Comment[];
}

export async function getComments(postId: string): Promise<Comment[]> {
  const all = await getAllComments();
  return all
    .filter((c) => c.postId === postId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export async function addComment(
  postId: string,
  username: string,
  content: string
): Promise<Comment> {
  const all = await getAllComments();
  const comment: Comment = {
    id: Crypto.randomUUID(),
    postId,
    username,
    content,
    createdAt: new Date().toISOString(),
  };
  all.push(comment);
  await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(all));

  const posts = await getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.commentCount += 1;
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }

  return comment;
}

function getSeedPosts(): Post[] {
  const now = new Date();
  return [
    {
      id: "seed-1",
      username: "Maria",
      caption:
        "Moving out! Free IKEA bookshelf in great condition. Pick up anytime this weekend. Located downtown.",
      postType: "giving",
      images: [],
      likeCount: 12,
      liked: false,
      commentCount: 3,
      createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "seed-2",
      username: "Jake",
      caption:
        "Looking for a small desk for my home office. Anything works! Willing to pick up.",
      postType: "looking",
      images: [],
      likeCount: 5,
      liked: false,
      commentCount: 1,
      createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: "seed-3",
      username: "Sarah",
      caption:
        "Just finished cleaning out the garage. Lots of kids toys, books, and kitchen items. DM me!",
      postType: "giving",
      images: [],
      likeCount: 24,
      liked: false,
      commentCount: 8,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: "seed-4",
      username: "Alex",
      caption:
        "Love this community! Already gave away 15 items this month. Let's keep the cycle going!",
      postType: "community",
      images: [],
      likeCount: 42,
      liked: false,
      commentCount: 6,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "seed-5",
      username: "Emma",
      caption:
        "Free vintage record player, needs a new needle but otherwise works perfectly. First come first served.",
      postType: "giving",
      images: [],
      likeCount: 31,
      liked: false,
      commentCount: 11,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}
