import { Component, OnInit} from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.page.html',
  styleUrls: ['./header.page.scss'],
})
export class HeaderPage implements OnInit {

  constructor() { }

  ngOnInit() {
  //   window.addEventListener('scroll', this.scroll, true);
	// 	$(window).scroll(function () {
  //     var scroll = $(window).scrollTop();
  //     if (scroll >= 60) {
  //       $(".landing-header").addClass("fixed");
  //     } else {
  //       $(".landing-header").removeClass("fixed");
  //     }
  //   });
  };

  // ngOnDestroy() {
  //   window.removeEventListener('scroll', this.scroll, true);
  // }
  
  // scroll = (event: any): void => {
  //   var scroll = $(window).scrollTop();
  //   if (scroll >= 60) {
  //     $(".landing-header").addClass("fixed");
  //   } else {
  //     $(".landing-header").removeClass("fixed");
  //   }
  // };
}
