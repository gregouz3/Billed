/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import {storeMock} from '../__mocks__/store.js'
import { ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";



describe("Given I am connected as an employee", () => {

  let newBills;
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
    newBills = new NewBill({
      document,
      onNavigate,
      storeMock,
      localStorageMock
    });
  })

  describe("When I am on NewBill Page", () => {

    test("Then mail icon in vertical layout should be highlighted", async () => {
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
        expect(fileInput.files[0]).not.toBe(file);
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled()
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
        expect(alertMock).toHaveBeenCalled();
        expect(fileInput.files[0]).toBe(file);
      })
    })

    describe('When send form ', () => {

      test('Submitting a new bill with valid data adds the bill to the list', () => {
        const bill = {
          email: 'user@example.com',
          type: 'Transport',
          name: 'Taxi',
          amount: 20,
          date: '2023-04-11',
          vat: '0.20',
          pct: 20,
          commentary: 'Trip to the airport',
          fileUrl: "",
          fileName:"",
          status: 'pending',
        };
        const handleSubmit = jest.fn(() => newBills.handleSubmit);
        const form = screen.getByTestId('form-new-bill');
        form.addEventListener("submit", handleSubmit);
        const select = screen.getByTestId('expense-type');
        const nameInput = screen.getByTestId('expense-name');
        const amountInput = screen.getByTestId('amount');
        const dateInput = screen.getByTestId('datepicker');
        const vatInput = screen.getByTestId('vat');
        const pctInput = screen.getByTestId('pct');
        const commentaryInput = screen.getByTestId('commentary');
        // Fill in the form fields with valid data
        fireEvent.change(select, { target: { value: bill.type } });
        fireEvent.change(nameInput, { target: { value: bill.name } });
        fireEvent.change(amountInput, { target: { value: bill.amount } });
        fireEvent.change(dateInput, { target: { value: bill.date } });
        fireEvent.change(vatInput, { target: { value: bill.vat } });
        fireEvent.change(pctInput, { target: { value: bill.pct } });
        fireEvent.change(commentaryInput, { target: { value: bill.commentary } });
        // Submit the form
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(form).toBeTruthy()
      });
    })
  });
})

