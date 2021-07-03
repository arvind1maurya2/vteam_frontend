import { Injectable } from '@angular/core';

@Injectable()
export class Globals {

  scrollStart(){
    //alert('started');
  }

  scrolling(event: any){
    if (event.detail.deltaY >= 60) {
      $(".landing-header").addClass("fixed");
    } else {
        $(".landing-header").removeClass("fixed");
    }
  }

  scrollEnd(){
    //alert('ended');
  } 
}