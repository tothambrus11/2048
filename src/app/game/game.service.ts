import {Inject, Injectable} from '@angular/core';
import {LOCAL_STORAGE, StorageService} from 'ngx-webstorage-service';
import {State} from "./game.component";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(@Inject(LOCAL_STORAGE) private storage: StorageService) {
  }

  get bestScore() {
    return this.storage.get("bestScore");
  }

  set bestScore(score: number) {
    this.storage.set("bestScore", score);
  }

  saveState(state: State){
    this.storage.set("state", state);
  }

  retrieveState(): State | undefined{
    return this.storage.get("state")
  }

  get hasStartedGame(){
    return !!this.retrieveState();
  }

}
