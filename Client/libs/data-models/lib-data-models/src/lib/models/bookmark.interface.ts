export class Bookmark {
  constructor(
    public id: number,
    public objectID: number,
    public objectTypeID: number,
    public objectTypeTypeID: number,
    public objectType: string,
    public isFavorite: boolean,
    public isRecent: boolean,
    public name: string,
    public path: string,
  ) {}
}