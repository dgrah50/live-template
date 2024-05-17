import { expect, test } from "bun:test";
import {
  InvalidCookiecutterRepository,
  CruftError,
  UnableToFindCookiecutterTemplate,
  NoCruftFound,
  CruftAlreadyPresent,
} from "../src/exceptions";

test("InvalidCookiecutterRepository instance", () => {
  const instance = new InvalidCookiecutterRepository(".");
  expect(instance).toBeInstanceOf(CruftError);
  expect(instance.cookiecutterRepo).toBe(".");
});

test("UnableToFindCookiecutterTemplate instance", () => {
  const instance = new UnableToFindCookiecutterTemplate(".");
  expect(instance.directory).toBe(".");
  expect(instance).toBeInstanceOf(CruftError);
});

test("NoCruftFound instance", () => {
  const instance = new NoCruftFound(".");
  expect(instance.directory).toBe(".");
  expect(instance).toBeInstanceOf(CruftError);
});

test("CruftAlreadyPresent instance", () => {
  const instance = new CruftAlreadyPresent(".");
  expect(instance.fileLocation).toBe(".");
  expect(instance).toBeInstanceOf(CruftError);
});
