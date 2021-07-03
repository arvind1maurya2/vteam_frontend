import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SecuredvdoPage } from './securedvdo.page';

describe('SecuredvdoPage', () => {
  let component: SecuredvdoPage;
  let fixture: ComponentFixture<SecuredvdoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecuredvdoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SecuredvdoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
