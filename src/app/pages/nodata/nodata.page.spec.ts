import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NodataPage } from './nodata.page';

describe('NodataPage', () => {
  let component: NodataPage;
  let fixture: ComponentFixture<NodataPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodataPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NodataPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
