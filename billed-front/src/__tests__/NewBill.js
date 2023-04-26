/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from '../__mocks__/store.js'
import { ROUTES_PATH} from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js";

describe("Given I am connected as an employee", () => {
  let newBills;
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        password: "employee",
        status: "connected",
      })
    );
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    document.body.innerHTML = NewBillUI()
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    newBills = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    });
  })

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.className).toEqual('active-icon')
    })

    describe('When I selected a file in the form', () => {
      test('Then I selected a file with allowed extensions', () => {
        const alertMock = jest.spyOn(window, "alert").mockImplementation();
        const file = new File(
          ["valid_file.jpeg"],
          "valid_file.jpeg",
          { type: "image/jpeg" }
        );
        const handleChangeFile = jest.fn(() => newBills.handleChangeFile);
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled()
        //one call by default
        expect(alertMock).toHaveBeenCalledTimes(1)
        expect(fileInput.files[0]).toBe(file);
      })

      test('Then I selected a file with not allowed extensions', () => {
        const alertMock = jest.spyOn(window, "alert").mockImplementation();
        const file = new File(
          ["invalid_file.txt"],
          "invalid_file.txt",
          { type: "text/plain" }
        );
        const handleChangeFile = jest.fn(() => newBills.handleChangeFile);
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled()
        //one call by default + one (alert invalid file)
        expect(alertMock).toHaveBeenCalledTimes(2)
      })
    })

    describe('When I fill data in the form newBill', () => {
      test('Then I submit form should lead to the bills page', () => {
        const handleSubmit = jest.fn(() => newBills.handleSubmit);
        const form = screen.getByTestId('form-new-bill');
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    })
  });
  // test d'intégration POST
  describe("When I update a bill", () => {
   
    test("Then the store should be updated with the given bill object and selector", async () => {
      const mockUpdate = jest.fn(() => Promise.resolve());
      newBills.store.bills().update = mockUpdate;
      const bill = {
        email: "john.doe@example.com",
        type: "Hotel",
        name: "Hotel stay",
        amount: 120,
        date: "2023-04-25",
        vat: "20%",
        pct: 20,
        commentary: "Nice stay",
        fileUrl: "https://example.com/bills/hotel_stay.jpg",
        fileName: "hotel_stay.jpg",
        status: "pending"
      };
      newBills.billId = "abc123";
      await newBills.updateBill(bill);
      expect(mockUpdate).toHaveBeenCalledWith({
        data: JSON.stringify(bill),
        selector: "abc123"
      });
    });

    test("Then the page should navigate to Bills after the update is successful", async () => {
      const mockUpdate = jest.fn(() => Promise.resolve());
      newBills.store.bills().update = mockUpdate;
      const onNavigate = jest.fn();
      newBills.onNavigate = onNavigate;
      const bill = {
        email: "john.doe@example.com",
        type: "Hotel",
        name: "Hotel stay",
        amount: 120,
        date: "2023-04-25",
        vat: "20%",
        pct: 20,
        commentary: "Nice stay",
        fileUrl: "https://example.com/bills/hotel_stay.jpg",
        fileName: "hotel_stay.jpg",
        status: "pending"
      };
      newBills.billId = "abc123";
      await newBills.updateBill(bill);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  })
})

 
