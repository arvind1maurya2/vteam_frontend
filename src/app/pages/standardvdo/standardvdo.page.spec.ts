import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StandardvdoPage } from './standardvdo.page';

describe('StandardvdoPage', () => {
  let component: StandardvdoPage;
  let fixture: ComponentFixture<StandardvdoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StandardvdoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StandardvdoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
