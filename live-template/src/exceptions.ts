export class CruftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CruftError";
  }
}

export class InvalidCookiecutterRepository extends CruftError {
  cookiecutterRepo: string;

  constructor(cookiecutterRepo: string) {
    super(`Invalid Cookiecutter repository: ${cookiecutterRepo}`);
    this.cookiecutterRepo = cookiecutterRepo;
  }
}

export class UnableToFindCookiecutterTemplate extends CruftError {
  directory: string;

  constructor(directory: string) {
    super(`Unable to find Cookiecutter template in directory: ${directory}`);
    this.directory = directory;
  }
}

export class NoCruftFound extends CruftError {
  directory: string;

  constructor(directory: string) {
    super(`No cruft found in directory: ${directory}`);
    this.directory = directory;
  }
}

export class CruftAlreadyPresent extends CruftError {
  fileLocation: string;

  constructor(fileLocation: string) {
    super(`Cruft already present at location: ${fileLocation}`);
    this.fileLocation = fileLocation;
  }
}

export class ChangesetUnicodeError extends CruftError {
  constructor() {
    super("Changeset contains non-UTF-8 characters");
  }
}
