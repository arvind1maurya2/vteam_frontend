import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';

@Component({
  selector: 'app-calling',
  templateUrl: './calling.page.html',
  styleUrls: ['./calling.page.scss'],
})
export class CallingPage implements OnInit {

  constructor(public globals: Globals) { }

  ngOnInit() {
  }

}
