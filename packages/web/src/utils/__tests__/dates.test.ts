import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { formatRelativeDate } from "../dates";

describe("formatRelativeDate", () => {
  let now: Date;

  beforeAll(() => {
    vi.useFakeTimers();
    now = new Date();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("formats a date less than a minute ago", () => {
    const date = new Date(now.getTime() - 30 * 1000);
    expect(formatRelativeDate(date)).toEqual("30 seconds ago");
  });

  test("formats a date less than an hour ago", () => {
    const date = new Date(now.getTime() - 30 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("30 minutes ago");
  });

  test("formats a date less than a day ago", () => {
    const date = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("12 hours ago");
  });

  test("formats a date less than a week ago", () => {
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("3 days ago");
  });

  test("formats a date less than a month ago", () => {
    const date = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("2 weeks ago");
  });

  test("formats a date less than a year ago", () => {
    const date = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("6 months ago");
  });

  test("formats a date more than a year ago", () => {
    const date = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(date)).toEqual("2 years ago");
  });
});
