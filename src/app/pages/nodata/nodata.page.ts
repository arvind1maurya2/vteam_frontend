import { Component, OnInit } from '@angular/core';
import { Globals } from 'src/app/globals';

@Component({
  selector: 'app-nodata',
  templateUrl: './nodata.page.html',
  styleUrls: ['./nodata.page.scss'],
})
export class NodataPage implements OnInit {

  constructor(public globals: Globals) { }

  ngOnInit() {
  }

}
