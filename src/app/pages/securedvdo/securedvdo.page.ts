import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';

@Component({
  selector: 'app-securedvdo',
  templateUrl: './securedvdo.page.html',
  styleUrls: ['./securedvdo.page.scss'],
})
export class SecuredvdoPage implements OnInit {

  constructor(public globals: Globals) { }

  ngOnInit() {
  }

}
