import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Globals } from 'src/app/globals';

@Component({
  selector: 'app-video',
  templateUrl: './video.page.html',
  styleUrls: ['./video.page.scss'],
})
export class VideoPage implements OnInit {

  allUsers: string[][] = [['Room-1', 'Room-2', 'Room-3', 'Room-4', 'Room-5', 'Room-6', 'Room-7', 'Room-8', 'Room-9', 'Room-10', 'Room-11', 'Room-12', 'Room-13', 'Room-14', 'Room-15', 'Room-16', 'Room-17', 'Room-18', 'Room-19', 'Room-20', 'Room-21', 'Room-22', 'Room-23', 'Room-24']];
  myWelcome: any;
  theTime: any;
  // Services
  // app.controller('myCtrl', function($scope, $interval) {
  //   $scope.theTime = new Date().toLocaleTimeString();
  //   $interval(function () {
  //     $scope.theTime = new Date().toLocaleTimeString();
  //   }, 1000);
  // };

  constructor(private http: HttpClient, public globals: Globals) { }

  ngOnInit() {

    this.theTime = new Date().toLocaleTimeString();;
    this.execute(); 
  }

  execute = function () {

    // write API in place of abc
    this.http.get('abc')
      .subscribe(res => {
        console.log(res);
        this.myWelcome = res.data;
      }, error => {
        console.log(error);
      });

      this.myWelcome = "hello";
  }

}
